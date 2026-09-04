/**
 * Kitchen Display Queue Controller
 * Module 7: Kitchen Display Queue APIs
 */

const Order = require('../models/Order');
const { ORDER_STATUS } = require('../config/constants');

/**
 * @desc    Get active kitchen orders queue sorted by time (FIFO)
 * @route   GET /api/kitchen/queue
 * @access  Private (Kitchen, Manager, Admin)
 */
const getKitchenQueue = async (req, res, next) => {
  try {
    const { branchId, status } = req.query;

    const filter = {};
    if (branchId) filter.branchId = branchId;

    // By default, fetch active kitchen statuses: Placed, Preparing, Ready
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: [ORDER_STATUS.PLACED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY] };
    }

    const orders = await Order.find(filter)
      .populate('branchId', 'name city')
      .populate('tableId', 'tableNumber locationZone')
      .populate('customerId', 'name')
      .sort({ createdAt: 1 }); // Oldest first for FIFO preparation queue

    const now = new Date();

    const formattedQueue = orders.map(order => {
      const elapsedMinutes = Math.floor((now - new Date(order.createdAt)) / (1000 * 60));
      const remainingMinutes = Math.max(0, (order.estimatedPrepTimeMinutes || 20) - elapsedMinutes);
      const isUrgent = elapsedMinutes > (order.estimatedPrepTimeMinutes || 20);

      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        branch: order.branchId ? { id: order.branchId._id, name: order.branchId.name } : null,
        orderType: order.orderType,
        tableNumber: order.tableId ? order.tableId.tableNumber : (order.orderType === 'Takeaway' ? 'Takeaway' : 'N/A'),
        locationZone: order.tableId ? order.tableId.locationZone : 'Counter',
        customerName: order.customerId ? order.customerId.name : 'Guest',
        items: order.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          specialNotes: i.specialNotes
        })),
        status: order.status,
        createdAt: order.createdAt,
        elapsedMinutes,
        estimatedPrepTimeMinutes: order.estimatedPrepTimeMinutes || 20,
        remainingMinutes,
        isUrgent
      };
    });

    res.status(200).json({
      success: true,
      message: 'Kitchen queue retrieved successfully',
      data: {
        count: formattedQueue.length,
        placedCount: formattedQueue.filter(o => o.status === ORDER_STATUS.PLACED).length,
        preparingCount: formattedQueue.filter(o => o.status === ORDER_STATUS.PREPARING).length,
        readyCount: formattedQueue.filter(o => o.status === ORDER_STATUS.READY).length,
        queue: formattedQueue
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Quickly advance order status from Kitchen Display
 * @route   PUT /api/kitchen/orders/:id/status
 * @access  Private (Kitchen, Manager, Admin)
 */
const updateKitchenOrderStatus = async (req, res, next) => {
  try {
    const { status, remarks } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errorCode: 'ORDER_NOT_FOUND'
      });
    }

    // Auto advance if status is not explicitly passed:
    // Placed -> Preparing -> Ready
    let nextStatus = status;
    if (!nextStatus) {
      if (order.status === ORDER_STATUS.PLACED) nextStatus = ORDER_STATUS.PREPARING;
      else if (order.status === ORDER_STATUS.PREPARING) nextStatus = ORDER_STATUS.READY;
      else if (order.status === ORDER_STATUS.READY) nextStatus = ORDER_STATUS.SERVED;
      else nextStatus = order.status;
    }

    order.status = nextStatus;
    order.statusHistory.push({
      status: nextStatus,
      timestamp: new Date(),
      remarks: remarks || `Status updated by kitchen staff`,
      updatedBy: req.user._id
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: `Order advanced to ${nextStatus}`,
      data: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get summary metrics for kitchen dashboard
 * @route   GET /api/kitchen/metrics
 * @access  Private (Kitchen, Manager, Admin)
 */
const getKitchenMetrics = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const filter = { createdAt: { $gte: today } };
    if (branchId) filter.branchId = branchId;

    const todayOrders = await Order.find(filter);

    const activeTickets = todayOrders.filter(o => [ORDER_STATUS.PLACED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY].includes(o.status)).length;
    const completedToday = todayOrders.filter(o => [ORDER_STATUS.SERVED, ORDER_STATUS.DELIVERED].includes(o.status)).length;
    const cancelledToday = todayOrders.filter(o => o.status === ORDER_STATUS.CANCELLED).length;

    res.status(200).json({
      success: true,
      message: 'Kitchen metrics retrieved successfully',
      data: {
        activeTickets,
        completedToday,
        cancelledToday,
        totalToday: todayOrders.length
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getKitchenQueue,
  updateKitchenOrderStatus,
  getKitchenMetrics
};
