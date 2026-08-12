const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { protect, authorize } = require('../middleware/auth');

// All routes require login
router.use(protect);

// GET /api/suppliers  — list with search, filter, pagination
router.get('/', async (req, res) => {
  try {
    const { search, status, category, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (status)   query.status   = status;
    if (category) query.category = category;

    const total = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, count: suppliers.length, total, page: Number(page), data: suppliers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/suppliers/:id
router.get('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/suppliers — admin & manager only
router.post('/', authorize('admin', 'manager'), async (req, res) => {
  try {
    const supplier = await Supplier.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: supplier });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT /api/suppliers/:id
router.put('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, data: supplier });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE /api/suppliers/:id — admin only
router.delete('/:id', authorize('admin'), async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ success: false, message: 'Supplier not found' });
    res.json({ success: true, message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
