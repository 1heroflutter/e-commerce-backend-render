const dotenv = require('dotenv');
dotenv.config();

 const ENV_VARS = {
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    PORT: process.env.PORT || 3000,
    PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    PAYPAL_SECRET: process.env.PAYPAL_CLIENT_SECRET,
    VNPAY_TMN_CODE: process.env.VNPAY_TMN_CODE,
    VNPAY_HASH_SECRET: process.env.VNPAY_HASH_SECRET,
    GHN_TOKEN: process.env.GHN_TOKEN,
    GHN_SHOP_ID: process.env.GHN_SHOP_ID,
    FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
};
module.exports = { ENV_VARS };