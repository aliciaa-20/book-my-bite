/**
 * MenuItem Mongoose Model
 * Collection: menuItems
 */

const mongoose = require('mongoose');
const { MENU_CATEGORIES } = require('../config/constants');

const menuItemSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      default: null // null means globally available across all branches
    },
    name: {
      type: String,
      required: [true, 'Dish name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: MENU_CATEGORIES,
      required: [true, 'Category is required']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be positive']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    isVeg: {
      type: Boolean,
      default: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    preparationTime: {
      type: Number, // in minutes
      default: 15,
      min: [1, 'Preparation time must be at least 1 minute']
    },
    dietaryTags: {
      type: [String],
      default: []
    },
    image: {
      type: String,
      default: ''
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes
menuItemSchema.index({ branchId: 1, category: 1 });
menuItemSchema.index({ name: 1 });
menuItemSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
