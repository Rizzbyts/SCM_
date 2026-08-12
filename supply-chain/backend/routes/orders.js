const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const { status, supplier, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status)   query.status = status;
    if (supplier) query.supplier = supplier;
    if (search)   query.poNumber = new RegExp(search, 'i');

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('supplier', 'name email')
      .populate('items.product', 'name sku')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, count: orders.length, total, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('supplier')
      .populate('items.product')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/orders
router.post('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    const order = await Order.create({ ...req.body, createdBy: req.user._id });
    order.timeline.push({ status: 'Pending', note: 'Order created', updatedBy: req.user._id });
    await order.save();
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/approve
router.patch('/:id/approve', authorize('admin', 'manager'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.status !== 'Pending') return res.status(400).json({ success: false, message: 'Only pending orders can be approved' });
    order.status = 'Approved';
    order.approvedBy = req.user._id;
    order.timeline.push({ status: 'Approved', note: 'Order approved', updatedBy: req.user._id });
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    order.status = status;
    if (status === 'Delivered') {
      order.deliveredAt = new Date();
      // Increase inventory
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, { $inc: { quantity: item.quantity } });
      }
    }
    order.timeline.push({ status, note: note || `Status changed to ${status}`, updatedBy: req.user._id });
    await order.save();
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/orders/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!['Pending', 'Cancelled'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Cannot delete active orders' });
    }
    await order.deleteOne();
    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
