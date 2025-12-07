const adminSdk = require('firebase-admin');
const fs = require('fs'); // Có thể bỏ qua nếu không đọc file
// const path = require('path'); // Có thể bỏ qua

function initFirebase() {
    if (adminSdk.apps.length) return adminSdk;

    // 1. Định nghĩa tên biến môi trường bạn sẽ sử dụng
    const envVarName = 'FIREBASE_SERVICE_ACCOUNT_CREDENTIALS'; 
    
    // 2. Lấy chuỗi JSON từ biến môi trường
    const serviceAccountJson = process.env[envVarName];

    if (!serviceAccountJson) {
        console.warn('⚠️ Biến môi trường Firebase key không tìm thấy. Khởi tạo Firebase mặc định.');
        adminSdk.initializeApp();
        return adminSdk;
    }
    
    // 3. Phân tích chuỗi JSON thành đối tượng
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
        console.error('Lỗi khi phân tích JSON Service Account:', e);
        throw new Error('Invalid Firebase JSON credentials. Server stopped.');
    }

    console.log("🔥 Firebase Admin SDK initialized successfully.");
    return adminSdk;
}

module.exports = { initFirebase };
