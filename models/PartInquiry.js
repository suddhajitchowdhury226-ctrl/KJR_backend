const mongoose = require('mongoose');

const partInquirySchema = new mongoose.Schema({
  // What they searched for
  query: { type: String, required: true, trim: true },

  // Customer info (from logged-in user or manually entered in chat form)
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true },
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
