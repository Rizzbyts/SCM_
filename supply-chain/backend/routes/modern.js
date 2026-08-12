const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/forecast', async (req, res) => {
  res.json({
    success: true,
    data: {
      demandForecast: {
        product: 'Industrial Widget',
        next30Days: 1820,
        recommendedReorder: 320,
        stockDaysLeft: 5,
        confidence: '87%',
      },
      topRisks: [
        { title: 'Low stock for Fastener Kits', risk: 'High', daysLeft: 3 },
        { title: 'Supplier lead time increase', risk: 'Medium', impact: 'Delivery delay' },
      ],
      automationSuggestions: [
        { message: 'Auto-create purchase order for Industrial Widget when stock falls below 280 units', priority: 'High' },
      ],
    },
  });
});

router.get('/traceability', async (req, res) => {
  res.json({
    success: true,
    data: {
      productId: 'SC-1001',
      qrCodeUrl: 'https://example.com/qr/SC-1001',
      journey: [
        { step: 'Manufactured', location: 'Chennai Plant', date: '2026-05-19', status: 'Completed' },
        { step: 'Quality check', location: 'Chennai Plant', date: '2026-05-20', status: 'Completed' },
        { step: 'Dispatched', location: 'Mumbai HUB', date: '2026-05-22', status: 'In transit' },
        { step: 'Warehouse arrival', location: 'Bengaluru DC', date: '2026-05-23', status: 'Pending' },
      ],
    },
  });
});

router.get('/risk-alerts', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'R-001', type: 'Supplier Delay', description: 'Primary steel supplier has a forecasted delay of 7 days.', severity: 'High', action: 'Notify purchasing', status: 'Open' },
      { id: 'R-002', type: 'Shipment Risk', description: 'Route congestion may delay the Bangalore delivery.', severity: 'Medium', action: 'Re-route shipment', status: 'Monitoring' },
      { id: 'R-003', type: 'Inventory Shortage', description: 'Battery packs are projected to run out in 4 days.', severity: 'High', action: 'Trigger reorder', status: 'Open' },
    ],
  });
});

router.get('/automation', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'A-01', name: 'Auto PO creation', description: 'Create a purchase order automatically when any fast-moving product drops below minimum stock.', enabled: true },
      { id: 'A-02', name: 'Shipment ETA alert', description: 'Send SMS/email alert when shipment ETA changes by more than 3 hours.', enabled: true },
      { id: 'A-03', name: 'Low stock dashboard alert', description: 'Highlight low-stock SKUs and trigger a replenishment recommendation.', enabled: true },
    ],
  });
});

// GET /api/modern/iot-sensors — sample IoT sensor telemetry
router.get('/iot-sensors', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'S-101', location: 'Bengaluru DC', type: 'Temperature', value: 4.2, unit: '°C', humidity: 72, lastSeen: '2026-05-27T08:12:00Z' },
      { id: 'S-102', location: 'Mumbai Hub', type: 'Temperature', value: 6.8, unit: '°C', humidity: 68, lastSeen: '2026-05-27T08:10:00Z' },
      { id: 'S-201', location: 'Chennai Plant', type: 'Humidity', value: 55, unit: '%', lastSeen: '2026-05-27T07:55:00Z' },
    ],
  });
});

// GET /api/modern/live-shipments — sample live shipment positions
router.get('/live-shipments', async (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'SHIP-1001', vehicle: 'TRUCK-23', lat: 12.9716, lng: 77.5946, status: 'In Transit', eta: '2026-05-28T14:00:00Z', speedKmph: 42 },
      { id: 'SHIP-1002', vehicle: 'VAN-11', lat: 19.0760, lng: 72.8777, status: 'Out for Delivery', eta: '2026-05-27T18:30:00Z', speedKmph: 25 },
    ],
  });
});
module.exports = router;
