const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true, minlength: 6, select: false },
  role:      { type: String, enum: ['admin', 'manager', 'viewer'], default: 'viewer' },
  isActive:  { type: Boolean, default: true },
  lastLogin: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

userSchema.methods.getSignedJwt = function () {
  const secret = process.env.JWT_SECRET || 'change-me-in-production';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id: this._id, role: this.role }, secret, { expiresIn });
};

module.exports = mongoose.model('User', userSchema);
