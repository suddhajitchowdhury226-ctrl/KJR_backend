const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  projectName: { type: String, required: true },
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  emailAddress: { type: String, required: true },
  phone: { type: String, default: '' },
  bidIntent: { type: String, enum: ['yes', 'no'], required: true },
  declineReason: { type: String, default: '' },
  bidAmount: { type: Number, default: 0 },
  comments: { type: String, default: '' },
  documentsUrls: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Bid', bidSchema);
