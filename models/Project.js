const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  location: { type: String, required: true },
  address: { type: String, default: '' },
  bidDueDate: { type: String, required: true },
  estimator: { type: String, default: 'KING MTUSA' },
  bidEmail: { type: String, default: 'estimating@kjrid.com' },
  state: { type: String, default: '' },
  stateCode: { type: String, default: '' },
  costCodes: [{
    code: String,
    description: String,
    scope: String
  }],
  tradesRequested: [String],
  notes: [String],
  hasDocs: { type: Boolean, default: false },
  drawingsUrl: { type: String, default: '' },
  specificationsUrl: { type: String, default: '' },
  status: { type: String, enum: ['active', 'closed', 'draft'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);
