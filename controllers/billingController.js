/**
 * Billing & Order Summary Controller
 * Module 8: Billing & Order Summary
 */

const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { calculateOrderBill } = require('../utils/calculator');
const { PROMO_CODES, PAYMENT_STATUS, PAYMENT_METHODS } = require('../config/constants');

/**
 * @desc    Calculate live bill preview before order submission
 * @route   POST /api/billing/calculate
 * @access  Public / Authenticated
 */
const calculateBill = async (req, res, next) => {
  try {
    const { items, promoCode, orderType } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'At least one item is required for bill calculation',
        errorCode: 'EMPTY_ITEMS'
      });
    }

    const itemIds = items.map(i => i.menuItemId);
    const dbMenuItems = await MenuItem.find({ _id: { $in: itemIds } });
    const menuItemMap = new Map(dbMenuItems.map(m => [m._id.toString(), m]));

    const verifiedItems = [];
    for (const item of items) {
      const dbItem = menuItemMap.get(item.menuItemId.toString());
      if (dbItem) {
        verifiedItems.push({
          menuItemId: dbItem._id,
          name: dbItem.name,
          price: dbItem.price,
          quantity: item.quantity || 1
        });
      }
    }

    const billing = calculateOrderBill(verifiedItems, promoCode, orderType || 'Dine-In');

    res.status(200).json({
      success: true,
      message: 'Bill calculated successfully',
      data: {
        items: verifiedItems,
        billing
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get full itemized invoice for an order
 * @route   GET /api/billing/orders/:id/invoice
 * @access  Private (Owner, Staff, Admin)
 */
const getOrderInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('branchId', 'name address city phone')
      .populate('tableId', 'tableNumber locationZone')
      .populate('customerId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errorCode: 'ORDER_NOT_FOUND'
      });
    }

    // Role ownership check
    if (req.user.role === 'customer' && order.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot access invoices for other customer orders',
        errorCode: 'FORBIDDEN'
      });
    }

    const invoice = {
      invoiceNumber: `INV-${order.orderNumber.replace('ORD-', '')}`,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      restaurant: order.branchId,
      customer: {
        name: order.customerId.name,
        email: order.customerId.email,
        phone: order.customerId.phone
      },
      diningDetails: {
        orderType: order.orderType,
        tableNumber: order.tableId ? order.tableId.tableNumber : 'N/A',
        zone: order.tableId ? order.tableId.locationZone : 'Takeaway'
      },
      lineItems: order.items.map(item => ({
        name: item.name,
        unitPrice: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity,
        notes: item.specialNotes
      })),
      pricingBreakdown: {
        subtotal: order.subtotal,
        promoCode: order.promoCode,
        discountAmount: order.discountAmount,
        taxRate: `${order.taxRate * 100}% GST`,
        taxAmount: order.taxAmount,
        serviceChargeRate: `${order.serviceChargeRate * 100}%`,
        serviceCharge: order.serviceCharge,
        grandTotal: order.totalAmount
      },
      payment: {
        status: order.paymentStatus,
        method: order.paymentMethod
      }
    };

    res.status(200).json({
      success: true,
      message: 'Invoice retrieved successfully',
      data: {
        invoice
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Process mock payment for an order
 * @route   POST /api/billing/orders/:id/pay
 * @access  Private (Customer, Staff, Admin)
 */
const processOrderPayment = async (req, res, next) => {
  try {
    const { paymentMethod, transactionRef } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errorCode: 'ORDER_NOT_FOUND'
      });
    }

    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      return res.status(400).json({
        success: false,
        message: 'This order has already been paid in full',
        errorCode: 'ALREADY_PAID'
      });
    }

    order.paymentStatus = PAYMENT_STATUS.PAID;
    order.paymentMethod = paymentMethod || PAYMENT_METHODS.ONLINE;

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Payment completed successfully',
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        totalPaid: order.totalAmount,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        transactionId: transactionRef || `TXN-${Date.now()}`
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active promo codes list
 * @route   GET /api/billing/promo-codes
 * @access  Public
 */
const getAvailablePromoCodes = (req, res) => {
  const codes = Object.keys(PROMO_CODES).map(code => ({
    code,
    ...PROMO_CODES[code]
  }));

  res.status(200).json({
    success: true,
    message: 'Active promo codes retrieved',
    data: {
      promoCodes: codes
    }
  });
};

module.exports = {
  calculateBill,
  getOrderInvoice,
  processOrderPayment,
  getAvailablePromoCodes
};
