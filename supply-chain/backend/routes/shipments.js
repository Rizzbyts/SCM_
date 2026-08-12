const express = require('express');
const router = express.Router();
const Shipment = require('../models/Shipment');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};
    const total = await Shipment.countDocuments(query);
    const shipments = await Shipment.find(query)
      .populate({ path: 'order', select: 'poNumber supplier', populate: { path: 'supplier', select: 'name' } })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, count: shipments.length, total, data: shipments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id).populate('order').populate('createdBy', 'name');
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    res.json({ success: true, data: shipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    const shipment = await Shipment.create({ ...req.body, createdBy: req.user._id });
    shipment.timeline.push({ status: 'Processing', note: 'Shipment created' });
    await shipment.save();
    await Order.findByIdAndUpdate(req.body.order, { status: 'Shipped' });
    res.status(201).json({ success: true, data: shipment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.patch('/:id/status', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status, location, note } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found' });
    shipment.status = status;
    if (status === 'Delivered') shipment.deliveredAt = new Date();
    shipment.timeline.push({ status, location, note });
    await shipment.save();
    if (status === 'Delivered') {
      await Order.findByIdAndUpdate(shipment.order, { status: 'Delivered', deliveredAt: new Date() });
    }
    res.json({ success: true, data: shipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
