const { ENV_VARS } = require('../config/envVars');
const express = require('express');
const router = express.Router();
const { createOrder, captureOrder } = require('../services/paypalService');
const admin = require('firebase-admin');


// Create order endpoint (called by Flutter client)
// Client provides amount and currency, server returns approveUrl and orderId
router.post('/create-order', async (req, res) => {
    try {
        const { amount, currency = 'USD', metadata } = req.body;
        if (!amount) return res.status(400).json({ error: 'amount required' });
        const BASE_URL = ENV_VARS.BASE_URL;
        const returnUrl = `${BASE_URL}/api/paypal/success-redirect`;
        const cancelUrl = `${BASE_URL}/api/paypal/cancel-redirect`;

        const paypalOrder = await createOrder(amount, currency, returnUrl, cancelUrl);
        // find approve link
        const approveLink = (paypalOrder.links || []).find(l => l.rel === 'approve');
        res.json({ orderId: paypalOrder.id, approveUrl: approveLink ? approveLink.href : null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'create-order-failed', details: err.message });
    }
});


// Capture order endpoint (server-side capture)
// Client can call this after user approves on PayPal or use PayPal webhooks
router.post('/capture-order', async (req, res) => {
    try {
        const { orderId, clientOrderId, metadata } = req.body;
        if (!orderId) return res.status(400).json({ error: 'orderId required' });


        const capture = await captureOrder(orderId);


        // Save order to Firestore
        const firestore = admin.firestore();
        const ordersColl = firestore.collection(process.env.FIRESTORE_COLLECTION_ORDERS || 'orders');


        const doc = {
            paypal: capture,
            clientOrderId: clientOrderId || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };


        const writeRes = await ordersColl.add(doc);


        res.json({ ok: true, capture, orderDocId: writeRes.id });
    } catch (err) {
        console.error('capture-order error', err.response ? err.response.data : err.message);
        res.status(500).json({ error: 'capture-failed', details: err.message });
    }
});

router.post('/webhook', async (req, res) => {
    console.log('paypal webhook received', req.body);
    // handle events like PAYMENT.CAPTURE.COMPLETED etc.
    res.sendStatus(200);
});
router.get("/success-redirect", (req, res) => {
    const token = req.query.token;

    const payerId = req.query.PayerID || req.query.payer_id;

    console.log(`[PAYPAL REDIRECT] Token: ${token}, PayerID/payer_id nhận được: ${payerId}`);

    if (!payerId) {
        console.error('[PAYPAL REDIRECT ERROR] Không tìm thấy PayerID/payer_id trong redirect!');
        return res.redirect("myapp://paypal-cancel?error=missing_payer_id");
    }

    const appUri = `myapp://paypal-success?token=${token}&payerId=${payerId}`;
    return res.redirect(appUri);
});

router.get("/cancel-redirect", (req, res) => {
    const appUri = "myapp://paypal-cancel";
    return res.redirect(appUri);
});


module.exports = router;