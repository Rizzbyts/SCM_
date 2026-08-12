const mongoose = require('mongoose');

const shipmentSchema = new mongoose.Schema({
  shipmentId: { type: String, unique: true },
  order:      { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  carrier:    { type: String, required: true },
  trackingNo: { type: String },
  origin:     { type: String },
  destination:{ type: String },
  status:     { type: String, enum: ['Processing', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Returned'], default: 'Processing' },
  eta:        { type: Date },
  deliveredAt:{ type: Date },
  timeline: [{
    status: String,
    location: String,
    note: String,
    date: { type: Date, default: Date.now },
  }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

shipmentSchema.pre('save', function (next) {
  if (!this.shipmentId) {
    this.shipmentId = 'SH-' + Date.now().toString().slice(-6);
  }
  next();
});

module.exports = mongoose.model('Shipment', shipmentSchema);
