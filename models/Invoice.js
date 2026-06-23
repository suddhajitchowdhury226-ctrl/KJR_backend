const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  part: { type: String, default: '' },
  qty: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  lineTotal: { type: Number, required: true }
});

// ── Tracking event (timeline entry) ────────────────────────────────────────
const trackingEventSchema = new mongoose.Schema({
  status: { type: String, required: true },  // e.g. "Order Placed", "Shipped"
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  transactionId: { type: String, default: '' },
  authCode: { type: String, default: '' },

  // Customer
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  company: { type: String, default: '' },

  // Shipping
  address: { type: String, default: '' },
  address2: { type: String, default: '' },
  city: { type: String, default: '' },
  state: { type: String, default: '' },
  zip: { type: String, default: '' },
  notes: { type: String, default: '' },

  // Main Warehouse / Shipping FROM address (always KJR's address)
  shipFromName: { type: String, default: 'Jacob N Artye' },
  shipFromCompany: { type: String, default: 'KJR Interior Designs Inc.' },
  shipFromAddress: { type: String, default: '775 Tipton Industrial Dr Suite F' },
  shipFromCity: { type: String, default: 'Lawrenceville' },
  shipFromState: { type: String, default: 'GA' },
  shipFromZip: { type: String, default: '30046' },
  shipFromCountry: { type: String, default: 'US' },

  // Line items & totals
  items: [invoiceItemSchema],
  subtotal: { type: Number, required: true },
  taxRate: { type: Number, default: 0.08 },
  taxAmount: { type: Number, required: true },
  shipping: { type: Number, default: 0 },
  total: { type: Number, required: true },

  // Admin approval fields
  approvalStatus: {
    type: String,
    enum: ['pending_approval', 'approved', 'rejected'],
    default: 'pending_approval'
  },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: String, default: '' },
  rejectedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: '' },

  // Order / tracking
  orderStatus: {
    type: String,
    enum: ['pending_approval', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending_approval'
  },
  trackingNumber: { type: String, default: '' },
  trackingCarrier: { type: String, default: '' },   // UPS, FedEx, USPS, etc.
  trackingUrl: { type: String, default: '' },
  estimatedDelivery: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },

  // Timeline events
  trackingEvents: [trackingEventSchema],

  // Payment status
  status: { type: String, enum: ['paid', 'pending', 'refunded'], default: 'paid' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', invoiceSchema);
