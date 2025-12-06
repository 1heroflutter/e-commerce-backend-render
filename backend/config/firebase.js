const ENV_VARS = require('./envVars').ENV_VARS;
const adminSdk = require('firebase-admin');
const fs = require('fs');


function initFirebase() {
if (adminSdk.apps.length) return adminSdk;


const keyPath = ENV_VARS.FIREBASE_SERVICE_ACCOUNT_PATH || '../serviceAccountKey.json';
if (!fs.existsSync(keyPath)) {
console.warn('Firebase service account key not found at', keyPath);
adminSdk.initializeApp();
return adminSdk;
}


const serviceAccount = require(keyPath);
adminSdk.initializeApp({
credential: adminSdk.credential.cert(serviceAccount),
});
return adminSdk;
}


module.exports = { initFirebase };