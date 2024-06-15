import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  imageUrl: { type: String },
  stock: { type: Number, default: 0 },
  dateAdded: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', ProductSchema);
