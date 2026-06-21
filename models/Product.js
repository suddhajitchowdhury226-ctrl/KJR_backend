const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  part: { type: String, default: '', trim: true },       // Part number
  category: { type: String, required: true, trim: true },
  brand: { type: String, default: '', trim: true },
  vertical: { type: String, default: '', trim: true },       // Department / vertical
  price: { type: String, default: '' },                   // Sale price e.g. "$109.95"
  was: { type: String, default: '' },                   // List/original price
  img: { type: String, default: '' },                   // Image URL or base64
  inStock: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Text index for search
productSchema.index({ name: 'text', part: 'text', brand: 'text', category: 'text' });

module.exports = mongoose.model('Product', productSchema);
