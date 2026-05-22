const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  category: { type: String, required: true, index: true },
  vertical: { type: String, default: 'HVAC', index: true },
  name: { type: String, required: true },
  part: { type: String, required: true },
  price: { type: Number, required: true },
  was: { type: Number, default: null },
  brand: { type: String, default: 'Gemaire' },
  img: { type: String, default: null },
  inStock: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Product', ProductSchema);
