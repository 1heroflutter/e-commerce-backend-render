const axiosGHN = require('axios');

// 1. Xử lý biến môi trường
const GHN_TOKEN = process.env.GHN_TOKEN;
// CHÚ Ý: Shop ID phải ép kiểu sang Number (Int)
const GHN_SHOP_ID = parseInt(process.env.GHN_SHOP_ID, 10); 

// 2. Chọn URL dựa trên chế độ Sandbox
const isSandbox = process.env.GHN_SANDBOX === 'true';
const GHN_BASE = isSandbox 
    ? 'https://dev-online-gateway.ghn.vn/shiip/public-api' 
    : 'https://online-gateway.ghn.vn/shiip/public-api';    

async function createShippingOrder(payload) {
    if (!GHN_TOKEN) throw new Error('GHN_TOKEN missing');

    const url = `${GHN_BASE}/v2/shipping-order/create`;
    const headers = {
        'Token': GHN_TOKEN,
        'ShopId': GHN_SHOP_ID, 
        'Content-Type': 'application/json'
    };
const body = Object.assign({ shop_id: GHN_SHOP_ID }, payload);

try {
        const res = await axiosGHN.post(url, body, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
}

async function calculateShippingFee(payload) {
    const url = `${GHN_BASE}/v2/shipping-order/fee`;
    const headers = { 
        'Token': GHN_TOKEN, 
        'ShopId': GHN_SHOP_ID, 
        'Content-Type': 'application/json' 
    };
    const body = Object.assign({ shop_id: GHN_SHOP_ID }, payload);

    try {
        const res = await axiosGHN.post(url, body, { headers });
        return res.data;
    } catch (error) {
        throw error;
    }
}


module.exports = { createShippingOrder, calculateShippingFee };