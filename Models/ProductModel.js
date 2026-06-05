const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    oldPrice: { type: Number, default: 0 },
    weight: { type: String, default: '' },
    category: {
      type: String,
      required: [true, 'Category is required'],
      lowercase: true,
      enum: ['fruits', 'vegetables', 'dairy', 'bakery', 'meat', 'beverages'],
    },
    brand: { type: String, default: 'Groceria Fresh' },
    image: { type: String, default: '' },
    stock: { type: Number, required: true, default: 100, min: 0 },
    ratings: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
