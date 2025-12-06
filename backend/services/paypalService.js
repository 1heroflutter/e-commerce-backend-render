const { ENV_VARS } = require('../config/envVars');
const axios = require('axios');
const qs = require('qs');


const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';
const PAYPAL_BASE = PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';


async function getAccessToken() {
const clientId = ENV_VARS.PAYPAL_CLIENT_ID;
const clientSecret = ENV_VARS.PAYPAL_SECRET;
const tokenUrl = `${PAYPAL_BASE}/v1/oauth2/token`;


const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

const res = await axios.post(tokenUrl, qs.stringify({ grant_type: 'client_credentials' }), {
headers: {
Authorization: `Basic ${auth}`,
'Content-Type': 'application/x-www-form-urlencoded'
}
});
return res.data.access_token;
}


async function createOrder(totalAmount, currency = 'USD', returnUrl, cancelUrl) {
const accessToken = await getAccessToken();
const url = `${PAYPAL_BASE}/v2/checkout/orders`;
const body = {
intent: 'CAPTURE',
purchase_units: [{ amount: { currency_code: currency, value: String(totalAmount) } }],
application_context: {
return_url: returnUrl,
cancel_url: cancelUrl
}
};
const res = await axios.post(url, body, { headers: { Authorization: `Bearer ${accessToken}` } });
return res.data; 
}


async function captureOrder(orderId) {
const accessToken = await getAccessToken();
const url = `${PAYPAL_BASE}/v2/checkout/orders/${orderId}/capture`;
const res = await axios.post(url, {}, { headers: { Authorization: `Bearer ${accessToken}` } });
return res.data;
}


module.exports = { createOrder, captureOrder };