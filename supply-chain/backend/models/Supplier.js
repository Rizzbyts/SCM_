const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  contactPerson:{ type: String, required: true },
  email:        { type: String, required: true },
  phone:        { type: String },
  address:      { type: String },
  city:         { type: String },
  category:     { type: String, enum: ['Raw Material', 'Electrical', 'Mechanical', 'Safety', 'Other'], default: 'Other' },
  paymentTerms: { type: String, enum: ['Net 30', 'Net 60', 'Advance', 'COD'], default: 'Net 30' },
  status:       { type: String, enum: ['Active', 'Inactive', 'Blacklisted'], default: 'Active' },
  rating:       { type: Number, min: 0, max: 5, default: 0 },
  totalOrders:  { type: Number, default: 0 },
  notes:        { type: String },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
