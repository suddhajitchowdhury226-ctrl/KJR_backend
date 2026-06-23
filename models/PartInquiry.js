const mongoose = require('mongoose');

const partInquirySchema = new mongoose.Schema({
  // What they searched for — always present
  query: { type: String, required: true, trim: true },

  // Customer info — optional (guest users may not be logged in)
  name: { type: String, default: 'Guest', trim: true },
  email: { type: String, default: '', trim: true },
  phone: { type: String, default: '', trim: true },

  // Status tracking
  status: {
    type: String,
    enum: ['new', 'contacted', 'resolved'],
    default: 'new'
  },

  // Admin notes
  adminNotes: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PartInquiry', partInquirySchema);
