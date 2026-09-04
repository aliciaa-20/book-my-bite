/**
 * Table Mongoose Model
 * Collection: tables
 */

const mongoose = require('mongoose');
const { TABLE_LOCATIONS } = require('../config/constants');

const tableSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required']
    },
    tableNumber: {
      type: String,
      required: [true, 'Table number/identifier is required'],
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'Seating capacity is required'],
      min: [1, 'Capacity must be at least 1 seat'],
      max: [20, 'Capacity cannot exceed 20 seats']
    },
    locationZone: {
      type: String,
      enum: TABLE_LOCATIONS,
      default: 'Indoor Main Hall'
    },
    isAvailable: {
      type: Boolean,
      default: true
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
tableSchema.index({ branchId: 1, tableNumber: 1 }, { unique: true });
tableSchema.index({ branchId: 1, capacity: 1 });
tableSchema.index({ branchId: 1, isAvailable: 1 });

module.exports = mongoose.model('Table', tableSchema);
