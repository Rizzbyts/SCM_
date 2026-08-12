const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product:   { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:  { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  total:     { type: Number },
});

const orderSchema = new mongoose.Schema({
  poNumber:        { type: String, unique: true },
  supplier:        { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  items:           [orderItemSchema],
  totalAmount:     { type: Number },
  status:          { type: String, enum: ['Pending', 'Approved', 'Shipped', 'Delivered', 'Cancelled'], default: 'Pending' },
  expectedDelivery:{ type: Date },
  deliveredAt:     { type: Date },
  notes:           { type: String },
  createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timeline: [{
    status:    String,
    note:      String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date:      { type: Date, default: Date.now },
  }],
}, { timestamps: true });

orderSchema.pre('save', function (next) {
  if (!this.poNumber) {
    this.poNumber = 'PO-' + Date.now().toString().slice(-6);
  }
  this.items.forEach(i => { i.total = i.quantity * i.unitPrice; });
  this.totalAmount = this.items.reduce((s, i) => s + i.total, 0);
  next();
});

module.exports = mongoose.model('Order', orderSchema);
