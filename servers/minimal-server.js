const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/test', (req, res) => {
  res.json({ status: 'OK', message: 'Server is working' });
});

app.get('/api/premium-status', (req, res) => {
  res.json({
    premiumFeaturesAvailable: true,
    premiumFields: {
      shipping: true,
      payments: true,
      shipments: true,
      invoice: true,
      orderUrl: true
    },
    enhancedAnalytics: true,
    subscriptionDetectionAccuracy: '41.5%',
    message: 'Premium Amazon extension detected - enhanced analytics available'
  });
});

app.listen(port, () => {
  console.log(`Minimal TSV Ledger server running at http://localhost:${port}`);
});
