const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku:           { type: String, required: true, unique: true, uppercase: true },
  name:          { type: String, required: true },
  description:   { type: String },
  category:      { type: String, enum: ['Raw Material', 'Electrical', 'Mechanical', 'Safety', 'Other'], default: 'Other' },
  unit:          { type: String, default: 'pcs' },
  price:         { type: Number, required: true, min: 0 },
  quantity:      { type: Number, required: true, default: 0, min: 0 },
  reorderLevel:  { type: Number, required: true, default: 50 },
  warehouse:     { type: String, default: 'WH-A' },
  supplier:      { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

productSchema.virtual('stockStatus').get(function () {
  const pct = (this.quantity / this.reorderLevel) * 100;
  if (pct < 40) return 'Critical';
  if (pct < 80) return 'Low';
  return 'OK';
});

productSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);
