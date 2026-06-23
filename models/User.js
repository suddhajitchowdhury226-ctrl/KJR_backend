const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' }, // Home, Work, Other
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  street: { type: String, default: '' },
  apt: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  country: { type: String, default: 'US' },
  phone: { type: String, default: '' },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  loginType: {
    type: String,
    enum: ['sales_team', 'parts', 'bids', 'property', 'grad'],
    required: true
  },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, default: '' },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  companyName: { type: String, default: '' },
  instructorName: { type: String, default: '' },
  avatar: { type: String, default: '' }, // base64 or URL
  addresses: { type: [addressSchema], default: [] },
  // Notification preferences
  notifOrderUpdates: { type: Boolean, default: true },
  notifPromotions: { type: Boolean, default: false },
  notifBidAlerts: { type: Boolean, default: true },
  notifSmsUpdates: { type: Boolean, default: false },
  notifInvoiceReady: { type: Boolean, default: true },
  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'suspended', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
