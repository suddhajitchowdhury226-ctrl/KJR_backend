const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  loginType: { type: String, enum: ['sales', 'grad'], required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: { type: String, default: '' },
  instructorName: { type: String, default: '' },
  status: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
