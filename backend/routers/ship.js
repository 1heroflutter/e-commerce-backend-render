const expressShip = require('express');
const routerShip = expressShip.Router();
const adminShip = require('firebase-admin');
const { createShippingOrder, calculateShippingFee } = require('../services/ghnService');

// Create shipping
routerShip.post('/create', async (req, res) => {
    try {
        const { 
            orderId, recipient, items, 
            to_district_id, to_ward_code, 
            service_type_id, cod_amount 
        } = req.body;

        if (!orderId || !recipient) return res.status(400).json({ error: 'orderId and recipient required' });

        // validate items structure for GHN
        const ghnItems = (items || []).map(item => ({
            name: item.title || item.name || 'Sản phẩm',
            code: item.id || 'code',
            quantity: item.quantity || 1,
            price: item.price || 0,
            length: 10,
            width: 10,
            height: 10,
            weight: 200 // Gram
        }));

        // Chuẩn bị Payload chuẩn GHN
        const payload = {
            to_name: recipient.name,
            to_phone: recipient.phone,
            to_address: recipient.address,
            to_ward_code: String(to_ward_code), 
            to_district_id: Number(to_district_id), 

            weight: ghnItems.reduce((total, item) => total + (item.weight * item.quantity), 0) || 200,
            length: 10,
            width: 10,
            height: 10,
            
            // Dịch vụ & Thanh toán
            service_type_id: Number(service_type_id) || 2,
            payment_type_id: 1, 
            required_note: 'CHOXEMHANGKHONGTHU',
            
            // Tiền thu hộ (COD)
            cod_amount: cod_amount || 0, 

            items: ghnItems
        };

        console.log('Đang tạo đơn GHN cho Order:', orderId);
        const ghnRes = await createShippingOrder(payload);

        // Save to Firestore
        const firestore = adminShip.firestore();
        const ordersColl = firestore.collection(process.env.FIRESTORE_COLLECTION_ORDERS || 'orders');

        // Lưu thông tin vận đơn vào đơn hàng
        await ordersColl.doc(orderId).set({ 
            shipping: {
                provider: 'GHN',
                order_code: ghnRes.data.order_code, // Mã vận đơn
                expected_delivery_time: ghnRes.data.expected_delivery_time,
                total_fee: ghnRes.data.total_fee,
                status: 'ready_to_pick', // Trạng thái ban đầu
                created_at: new Date().toISOString(),
                full_response: ghnRes.data
            } 
        }, { merge: true });

        res.json({ ok: true, order_code: ghnRes.data.order_code, ghn: ghnRes.data });

    } catch (err) {
        const errorDetail = err.response ? err.response.data : err.message;
        console.error('GHN Create Error:', JSON.stringify(errorDetail, null, 2));
        
        res.status(500).json({ 
            error: 'create-shipping-failed', 
            details: errorDetail 
        });
    }
});


// Calculate fee
routerShip.post('/fee', async (req, res) => {
    try {
        const payload = {
            "service_type_id": 2, 
            "insurance_value": 0, 
            "coupon": null,
            ...req.body
        };

        if(payload.to_district_id) payload.to_district_id = Number(payload.to_district_id);
        
        const feeRes = await calculateShippingFee(payload);
        res.json({ ok: true, fee: feeRes.data });
    } catch (err) {
        const errorDetail = err.response ? err.response.data : err.message;
        console.error('GHN Fee Error:', errorDetail);
        res.status(500).json({ error: 'fee-calc-failed', details: errorDetail });
    }
});

module.exports = routerShip;