/**
 * Feedback Mongoose Model
 * Collection: feedback
 */

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order reference is required'],
      unique: true // One feedback per order
    },
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
    rating: {
      type: Number,
      required: [true, 'Overall rating (1-5) is required'],
      min: [1, 'Minimum rating is 1'],
      max: [5, 'Maximum rating is 5']
    },
    foodRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    serviceRating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Indexes
feedbackSchema.index({ branchId: 1 });
feedbackSchema.index({ customerId: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
