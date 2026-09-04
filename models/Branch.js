/**
 * Branch Mongoose Model
 * Collection: branches
 */

const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Branch name is required'],
      trim: true,
      unique: true
    },
    address: {
      type: String,
      required: [true, 'Branch address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Branch phone is required'],
      trim: true
    },
    seatingCapacity: {
      type: Number,
      required: [true, 'Total seating capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    openingTime: {
      type: String,
      default: '11:00'
    },
    closingTime: {
      type: String,
      default: '23:00'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
branchSchema.index({ city: 1 });
branchSchema.index({ isActive: 1 });

module.exports = mongoose.model('Branch', branchSchema);
