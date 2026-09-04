/**
 * Reservation Mongoose Model
 * Collection: reservations
 */

const mongoose = require('mongoose');
const { RESERVATION_STATUS } = require('../config/constants');

const reservationSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer reference is required']
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
      required: [true, 'Branch reference is required']
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'Table reference is required']
    },
    reservationDate: {
      type: String, // Stored as YYYY-MM-DD for straightforward date queries
      required: [true, 'Reservation date is required']
    },
    timeSlot: {
      type: String, // Stored as HH:MM (e.g. "19:00")
      required: [true, 'Time slot is required']
    },
    durationMinutes: {
      type: Number,
      default: 90 // Standard 90-minute dining slot
    },
    guestsCount: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'Guest count must be at least 1']
    },
    specialRequests: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.CONFIRMED
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: ''
    },
    cancelledAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
reservationSchema.index({ customerId: 1 });
reservationSchema.index({ branchId: 1, reservationDate: 1, timeSlot: 1 });
reservationSchema.index({ tableId: 1, reservationDate: 1, status: 1 });

module.exports = mongoose.model('Reservation', reservationSchema);
