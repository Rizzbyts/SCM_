const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// GET /api/inventory
router.get('/', async (req, res) => {
  try {
    const { search, category, warehouse, lowStock, page = 1, limit = 20 } = req.query;
    const query = { isActive: true };
    if (search)    query.name = new RegExp(search, 'i');
    if (category)  query.category = category;
    if (warehouse) query.warehouse = warehouse;

    let products = await Product.find(query).populate('supplier', 'name').sort({ createdAt: -1 });

    if (lowStock === 'true') {
      products = products.filter(p => p.quantity <= p.reorderLevel);
    }

    const total = products.length;
    const paginated = products.slice((page - 1) * limit, page * limit);

    res.json({ success: true, count: paginated.length, total, data: paginated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/inventory/low-stock
router.get('/low-stock', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true });
    const lowStock = products.filter(p => p.quantity <= p.reorderLevel);
    res.json({ success: true, count: lowStock.length, data: lowStock });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/inventory/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('supplier', 'name email');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/inventory
router.post('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/inventory/:id
router.put('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH /api/inventory/:id/adjust — adjust stock quantity
router.patch('/:id/adjust', authorize('admin', 'manager'), async (req, res) => {
  try {
    const { adjustment, reason } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    product.quantity = Math.max(0, product.quantity + adjustment);
    await product.save();
    res.json({ success: true, data: product, message: `Stock adjusted by ${adjustment}` });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Product removed from inventory' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
