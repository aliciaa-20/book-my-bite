/**
 * Order Mongoose Model
 * Collection: orders
 */

const mongoose = require('mongoose');
const { ORDER_STATUS, ORDER_TYPES, PAYMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

const orderItemSchema = new mongoose.Schema(
  {
    menuItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    specialNotes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    remarks: {
      type: String,
      default: ''
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
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
    orderType: {
      type: String,
      enum: Object.values(ORDER_TYPES),
      default: ORDER_TYPES.DINE_IN
    },
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null
    },
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      default: null
    },
    items: {
      type: [orderItemSchema],
      required: [true, 'At least one order item is required'],
      validate: [val => val.length > 0, 'Order must contain at least one item']
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    promoCode: {
      type: String,
      default: null
    },
    taxRate: {
      type: Number,
      default: 0.05
    },
    taxAmount: {
      type: Number,
      required: true,
      min: 0
    },
    serviceChargeRate: {
      type: Number,
      default: 0.05
    },
    serviceCharge: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.ONLINE
    },
    estimatedPrepTimeMinutes: {
      type: Number,
      default: 20
    }
  },
  {
    timestamps: true
  }
);

// Indexes
orderSchema.index({ customerId: 1 });
orderSchema.index({ branchId: 1, status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
