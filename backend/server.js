const { ENV_VARS } = require('./config/envVars.js')
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const PORT = ENV_VARS.PORT || 3000;
const app = express();

app.use(cors());
app.use(bodyParser.json());


// init firebase admin
const { initFirebase } = require('./config/firebase.js');
const admin = initFirebase();


// routes
const paypalRouter = require('./routers/paypal');
const vnpayRouter = require('./routers/vnpay');
const shipRouter = require('./routers/ship');


app.use('/api/paypal', paypalRouter);
app.use('/api/vnpay', vnpayRouter);
app.use('/api/ship', shipRouter);


app.get('/', (req, res) => res.json({ ok: true }));



app.listen(PORT, () => console.log(`Server running on port ${PORT}`));