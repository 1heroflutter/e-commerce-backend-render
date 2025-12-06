const express = require('express');
const router = express.Router();
const moment = require('moment');
const qs = require('qs');
const crypto = require('crypto');

// Config lấy từ .env
const tmnCode = process.env.VNP_TMN_CODE;
const secretKey = process.env.VNP_HASH_SECRET;
const vnpUrl = process.env.VNP_URL;
const returnUrl = process.env.VNP_RETURN_URL; 

// 1. API Tạo URL thanh toán (Flutter gọi cái này)
router.post('/create_payment_url', function (req, res, next) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    
    let date = new Date();
    let createDate = moment(date).format('YYYYMMDDHHmmss');
    
    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    // --- FIX 1: Chuẩn hóa IP cho localhost ---
    if (ipAddr === '::1' || ipAddr.startsWith('::ffff:')) {
        ipAddr = '127.0.0.1'; 
    }
    // ----------------------------------------

    let { amount, orderId, bankCode, orderInfo } = req.body;
    
    // VNPay yêu cầu số tiền * 100
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId; 
    vnp_Params['vnp_OrderInfo'] = orderInfo || 'Thanh toan don hang';
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    if(bankCode !== null && bankCode !== ''){
        vnp_Params['vnp_BankCode'] = bankCode;
    }

    // 1. Lấy tất cả keys và SẮP XẾP theo thứ tự A-Z
    const sortedKeys = Object.keys(vnp_Params).sort();
    
    // 2. NỐI CHUỖI DỮ LIỆU ĐÃ ENCODE
    let hashData = '';
    
    for (let i = 0; i < sortedKeys.length; i++) {
        let key = sortedKeys[i];
        let value = vnp_Params[key];
        
        if (value != null && value != '') {
             // QUAN TRỌNG: Nối chuỗi đã encode URI
             hashData += key + '=' + encodeURIComponent(value);
        }

        if (i < sortedKeys.length - 1) {
             // Chỉ thêm '&' nếu không phải phần tử cuối và không phải giá trị rỗng
             if (vnp_Params[sortedKeys[i+1]] != null && vnp_Params[sortedKeys[i+1]] != '') {
                 hashData += '&';
             }
        }
    }
    
    // 3. TẠO HASH
    let hmac = crypto.createHmac("sha512", secretKey);
    let signed = hmac.update(hashData).digest("hex"); 
    
    // 4. Gán SecureHash vào vnp_Params
    vnp_Params['vnp_SecureHash'] = signed;
    
    // 5. Tạo URL cuối cùng
    let paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: false });

    res.json({ paymentUrl });
});

// 2. API Xử lý Return từ VNPay (Redirect về App)
router.get('/return', function (req, res, next) {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    // Xóa hash để check tính toàn vẹn
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // 1. SẮP XẾP KEYS
    const sortedKeys = Object.keys(vnp_Params).sort();
    
    // 2. NỐI CHUỖI DỮ LIỆU ĐÃ ENCODE
    let signData = '';

    for (let i = 0; i < sortedKeys.length; i++) {
        let key = sortedKeys[i];
        let value = vnp_Params[key]; 

        // BẮT BUỘC: PHẢI ENCODE LẠI GIÁ TRỊ TRƯỚC KHI NỐI CHUỖI TẠO HASH
        if (value != null && value != '') {
             signData += key + '=' + encodeURIComponent(value);
        }

        if (i < sortedKeys.length - 1) {
            // Chỉ thêm '&' nếu không phải phần tử cuối và giá trị tiếp theo không rỗng
            if (vnp_Params[sortedKeys[i+1]] != null && vnp_Params[sortedKeys[i+1]] != '') {
                 signData += '&';
            }
        }
    }
    
    // 3. TẠO HASH
    let hmac = crypto.createHmac("sha512", secretKey);
    // --- FIX 2: Dùng Buffer.from() thay vì new Buffer() ---
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
    // ----------------------------------------------------

    if (secureHash === signed) {
        // Check mã phản hồi (00 là thành công)
        const responseCode = vnp_Params['vnp_ResponseCode'];
        const orderId = vnp_Params['vnp_TxnRef'];

        if (responseCode === "00") {
            // Thành công -> Redirect về App Scheme
            res.redirect(`myapp://vnpay-success?responseCode=${responseCode}&orderId=${orderId}`);
        } else {
            // Thất bại
            res.redirect(`myapp://vnpay-cancel?responseCode=${responseCode}&orderId=${orderId}`);
        }
    } else {
        res.send("Checksum failed: Invalid hash"); 
    }
});


module.exports = router;