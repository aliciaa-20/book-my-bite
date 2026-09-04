/**
 * Food Order Placement, Status Workflow & History Controller
 * Module 5: Food Order Placement
 * Module 6: Order Status Workflow
 * Module 10: Customer Order History
 */

const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table = require('../models/Table');
const Branch = require('../models/Branch');
const { calculateOrderBill } = require('../utils/calculator');
const { ORDER_STATUS, ORDER_TYPES, ROLES, PAYMENT_STATUS } = require('../config/constants');

// Valid status transitions map
const VALID_TRANSITIONS = {
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.SERVED, ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.SERVED]: [], // Terminal state
  [ORDER_STATUS.DELIVERED]: [], // Terminal state
  [ORDER_STATUS.CANCELLED]: [] // Terminal state
};

/**
 * Generate human-readable order number
 */
const generateOrderNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${dateStr}-${randomSuffix}`;
};

/**
 * @desc    Place a new food order (Dine-in or Takeaway)
 * @route   POST /api/orders
 * @access  Private (Customer, Manager, Admin)
 */
const createOrder = async (req, res, next) => {
  try {
    const { branchId, orderType, tableId, reservationId, items, promoCode, paymentMethod } = req.body;
    const customerId = req.user.role === ROLES.CUSTOMER ? req.user._id : (req.body.customerId || req.user._id);

    // 1. Validate branch
    const branch = await Branch.findById(branchId);
    if (!branch || !branch.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Selected restaurant branch not found or inactive',
        errorCode: 'BRANCH_NOT_FOUND'
      });
    }

    // 2. Validate table if Dine-In
    if (orderType === ORDER_TYPES.DINE_IN && tableId) {
      const table = await Table.findOne({ _id: tableId, branchId, isActive: true });
      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Specified table not found in this branch',
          errorCode: 'TABLE_NOT_FOUND'
        });
      }
    }

    // 3. Validate menu items and construct item snapshots
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order must include at least one menu item',
        errorCode: 'EMPTY_ORDER_ITEMS'
      });
    }

    const itemIds = items.map(i => i.menuItemId);
    const dbMenuItems = await MenuItem.find({ _id: { $in: itemIds } });
    const menuItemMap = new Map(dbMenuItems.map(m => [m._id.toString(), m]));

    const verifiedItems = [];
    let maxPrepTime = 15;

    for (const itemInput of items) {
      const dbItem = menuItemMap.get(itemInput.menuItemId.toString());
      if (!dbItem) {
        return res.status(404).json({
          success: false,
          message: `Menu item with ID ${itemInput.menuItemId} not found`,
          errorCode: 'MENU_ITEM_NOT_FOUND'
        });
      }

      if (!dbItem.isAvailable) {
        return res.status(400).json({
          success: false,
          message: `Item '${dbItem.name}' is currently marked out-of-stock / unavailable.`,
          errorCode: 'ITEM_UNAVAILABLE'
        });
      }

      if (dbItem.preparationTime && dbItem.preparationTime > maxPrepTime) {
        maxPrepTime = dbItem.preparationTime;
      }

      verifiedItems.push({
        menuItemId: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: itemInput.quantity,
        specialNotes: itemInput.specialNotes || ''
      });
    }

    // 4. Compute accurate billing
    const billing = calculateOrderBill(verifiedItems, promoCode, orderType);

    // 5. Create Order
    const order = new Order({
      orderNumber: generateOrderNumber(),
      customerId,
      branchId,
      orderType: orderType || ORDER_TYPES.DINE_IN,
      tableId: tableId || null,
      reservationId: reservationId || null,
      items: verifiedItems,
      subtotal: billing.subtotal,
      discountAmount: billing.discountAmount,
      promoCode: billing.appliedPromo,
      taxRate: billing.taxRate,
      taxAmount: billing.taxAmount,
      serviceChargeRate: billing.serviceChargeRate,
      serviceCharge: billing.serviceCharge,
      totalAmount: billing.totalAmount,
      status: ORDER_STATUS.PLACED,
      statusHistory: [
        {
          status: ORDER_STATUS.PLACED,
          timestamp: new Date(),
          remarks: 'Order placed by customer',
          updatedBy: req.user._id
        }
      ],
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentMethod: paymentMethod || 'Online',
      estimatedPrepTimeMinutes: maxPrepTime + 5
    });

    await order.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('branchId', 'name city address phone')
      .populate('tableId', 'tableNumber capacity')
      .populate('customerId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Food order placed successfully',
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        order: populatedOrder
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update order status along the workflow lifecycle
 * @route   PUT /api/orders/:id/status
 * @access  Private (Kitchen, Manager, Admin)
 */
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${req.params.id} not found`,
        errorCode: 'ORDER_NOT_FOUND'
      });
    }

    // Validate workflow transition
    const allowedNextStatuses = VALID_TRANSITIONS[order.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from '${order.status}' to '${status}'. Allowed: [${allowedNextStatuses.join(', ')}]`,
        errorCode: 'INVALID_STATUS_TRANSITION'
      });
    }

    // Auto update payment if served/delivered
    if (status === ORDER_STATUS.SERVED || status === ORDER_STATUS.DELIVERED) {
      if (order.paymentStatus === PAYMENT_STATUS.PENDING) {
        order.paymentStatus = PAYMENT_STATUS.PAID;
      }
    }

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      remarks: remarks || `Status transitioned to ${status}`,
      updatedBy: req.user._id
    });

    await order.save();

    const updated = await Order.findById(order._id)
      .populate('branchId', 'name city')
      .populate('tableId', 'tableNumber')
      .populate('customerId', 'name phone');

    res.status(200).json({
      success: true,
      message: 'Status updated successfully',
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        order: updated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private (Owner, Kitchen, Manager, Admin)
 */
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('branchId', 'name city address phone')
      .populate('tableId', 'tableNumber capacity locationZone')
      .populate('customerId', 'name email phone');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order with ID ${req.params.id} not found`,
        errorCode: 'ORDER_NOT_FOUND'
      });
    }

    // Role ownership check
    if (req.user.role === ROLES.CUSTOMER && order.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view orders placed by other customers',
        errorCode: 'FORBIDDEN'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order retrieved successfully',
      data: {
        order
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get customer order history
 * @route   GET /api/customers/:id/orders or /api/orders/my-history
 * @access  Private (Customer self, Manager, Admin)
 */
const getCustomerOrderHistory = async (req, res, next) => {
  try {
    const targetCustomerId = req.params.id || req.user._id;

    // Check ownership
    if (req.user.role === ROLES.CUSTOMER && targetCustomerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot view another customer\'s history',
        errorCode: 'FORBIDDEN'
      });
    }

    const { status, orderType } = req.query;
    const filter = { customerId: targetCustomerId };

    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    const orders = await Order.find(filter)
      .populate('branchId', 'name city')
      .populate('tableId', 'tableNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Customer order history retrieved successfully',
      data: {
        count: orders.length,
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all orders (Manager / Admin filterable)
 * @route   GET /api/orders
 * @access  Private (Manager, Admin, Kitchen)
 */
const getAllOrders = async (req, res, next) => {
  try {
    const { branchId, status, orderType, startDate, endDate } = req.query;
    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;
    if (orderType) filter.orderType = orderType;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(filter)
      .populate('branchId', 'name city')
      .populate('tableId', 'tableNumber locationZone')
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully',
      data: {
        count: orders.length,
        orders
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel order (Customer can cancel if Placed)
 * @route   POST /api/orders/:id/cancel
 * @access  Private (Customer, Manager, Admin)
 */
const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errorCode: 'ORDER_NOT_FOUND'
      });
    }

    if (req.user.role === ROLES.CUSTOMER && order.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot cancel another user\'s order',
        errorCode: 'FORBIDDEN'
      });
    }

    if (order.status !== ORDER_STATUS.PLACED && req.user.role === ROLES.CUSTOMER) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is already '${order.status}' in the kitchen.`,
        errorCode: 'ORDER_IN_PREPARATION'
      });
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      timestamp: new Date(),
      remarks: reason || 'Customer requested order cancellation',
      updatedBy: req.user._id
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: {
        _id: order._id,
        status: order.status
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  updateOrderStatus,
  getOrderById,
  getCustomerOrderHistory,
  getAllOrders,
  cancelOrder
};
