const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const Shipment = require('../models/Shipment');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET /api/reports/summary
router.get('/summary', async (req, res) => {
  try {
    const [totalSuppliers, totalOrders, totalProducts, pendingShipments] = await Promise.all([
      Supplier.countDocuments({ status: 'Active' }),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Shipment.countDocuments({ status: { $in: ['In Transit', 'Processing'] } }),
    ]);
    const products = await Product.find({ isActive: true });
    const inventoryValue = products.reduce((s, p) => s + p.price * p.quantity, 0);
    const lowStockCount = products.filter(p => p.quantity <= p.reorderLevel).length;
    res.json({ success: true, data: { totalSuppliers, totalOrders, totalProducts, pendingShipments, inventoryValue, lowStockCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/monthly-orders
router.get('/monthly-orders', async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: new Date(`${year}-01-01`), $lt: new Date(`${year + 1}-01-01`) } } },
      { $group: { _id: { month: { $month: '$createdAt' } }, count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
      { $sort: { '_id.month': 1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reports/supplier-performance
router.get('/supplier-performance', async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { status: { $in: ['Delivered', 'Cancelled'] } } },
      { $group: { _id: '$supplier', total: { $sum: 1 }, delivered: { $sum: { $cond: [{ $eq: ['$status', 'Delivered'] }, 1, 0] } } } },
      { $addFields: { rate: { $multiply: [{ $divide: ['$delivered', '$total'] }, 100] } } },
      { $lookup: { from: 'suppliers', localField: '_id', foreignField: '_id', as: 'supplier' } },
      { $unwind: '$supplier' },
      { $project: { name: '$supplier.name', total: 1, delivered: 1, rate: 1 } },
      { $sort: { rate: -1 } },
    ]);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
