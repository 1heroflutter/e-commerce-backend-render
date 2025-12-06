const ENV_VARS = require('./envVars').ENV_VARS;
const adminSdk = require('firebase-admin');
const fs = require('fs');


function initFirebase() {
    if (adminSdk.apps.length) return adminSdk;

    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_CREDENTIALS;

    if (!serviceAccountJson) {
        console.error('⚠️ Lỗi: Biến FIREBASE_SERVICE_ACCOUNT_CREDENTIALS không được định nghĩa.');
        throw new Error('Firebase credentials not set in environment variables.');
    }
    
    let serviceAccount;
    try {
        // PHÂN TÍCH CHUỖI JSON
        serviceAccount = JSON.parse(serviceAccountJson);
    } catch (e) {
        console.error('Lỗi khi phân tích JSON Service Account:', e);
        throw new Error('Invalid Firebase JSON credentials.');
    }

    adminSdk.initializeApp({
        credential: adminSdk.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase Admin SDK initialized successfully.");
    return adminSdk;
}


module.exports = { initFirebase };