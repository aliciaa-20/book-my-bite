/**
 * Feedback & Rating Module Controller
 * Module 11: Feedback & Rating Module
 */

const Feedback = require('../models/Feedback');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { ORDER_STATUS, ROLES } = require('../config/constants');

/**
 * @desc    Submit feedback & rating for a completed order
 * @route   POST /api/feedback
 * @access  Private (Customer)
 */
const submitFeedback = async (req, res, next) => {
  try {
    const { orderId, rating, foodRating, serviceRating, comment } = req.body;
    const customerId = req.user._id;

    // 1. Verify order exists and belongs to this customer
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
        errorCode: 'ORDER_NOT_FOUND'
      });
    }

    if (req.user.role === ROLES.CUSTOMER && order.customerId.toString() !== customerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only submit feedback for your own orders',
        errorCode: 'FORBIDDEN'
      });
    }

    // 2. Verify order is in completed state
    if (![ORDER_STATUS.SERVED, ORDER_STATUS.DELIVERED].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Feedback can only be submitted for completed orders (Served or Delivered). Current status: '${order.status}'`,
        errorCode: 'ORDER_NOT_COMPLETED'
      });
    }

    // 3. Check if feedback already submitted
    const existingFeedback = await Feedback.findOne({ orderId });
    if (existingFeedback) {
      return res.status(409).json({
        success: false,
        message: 'Feedback has already been submitted for this order',
        errorCode: 'DUPLICATE_FEEDBACK'
      });
    }

    // 4. Save feedback
    const feedback = new Feedback({
      orderId,
      customerId,
      branchId: order.branchId,
      rating,
      foodRating: foodRating || rating,
      serviceRating: serviceRating || rating,
      comment: comment || ''
    });

    await feedback.save();

    // 5. Update rating metrics on the ordered menu items
    if (order.items && order.items.length) {
      for (const item of order.items) {
        const menuItem = await MenuItem.findById(item.menuItemId);
        if (menuItem) {
          const currentTotalScore = (menuItem.ratingAverage || 4.5) * (menuItem.ratingCount || 1);
          const newCount = (menuItem.ratingCount || 0) + 1;
          const newAvg = Math.round(((currentTotalScore + (foodRating || rating)) / newCount) * 10) / 10;
          menuItem.ratingAverage = Math.min(5, Math.max(1, newAvg));
          menuItem.ratingCount = newCount;
          await menuItem.save();
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thank you for your valuable feedback!',
      data: {
        _id: feedback._id,
        feedback
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get feedback for a branch with rating breakdown
 * @route   GET /api/feedback/branch/:branchId
 * @access  Public / Authenticated
 */
const getFeedbackByBranch = async (req, res, next) => {
  try {
    const { branchId } = req.params;

    const feedbackList = await Feedback.find({ branchId })
      .populate('customerId', 'name')
      .populate({
        path: 'orderId',
        select: 'orderNumber items orderType'
      })
      .sort({ createdAt: -1 });

    // Compute averages
    const totalReviews = feedbackList.length;
    let avgOverall = 0;
    let avgFood = 0;
    let avgService = 0;

    if (totalReviews > 0) {
      avgOverall = (feedbackList.reduce((acc, f) => acc + f.rating, 0) / totalReviews).toFixed(1);
      avgFood = (feedbackList.reduce((acc, f) => acc + f.foodRating, 0) / totalReviews).toFixed(1);
      avgService = (feedbackList.reduce((acc, f) => acc + f.serviceRating, 0) / totalReviews).toFixed(1);
    }

    res.status(200).json({
      success: true,
      message: 'Branch feedback retrieved successfully',
      data: {
        branchId,
        totalReviews,
        averageRatings: {
          overall: Number(avgOverall),
          food: Number(avgFood),
          service: Number(avgService)
        },
        reviews: feedbackList
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's submitted feedback
 * @route   GET /api/feedback/my-feedback
 * @access  Private (Customer)
 */
const getMyFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ customerId: req.user._id })
      .populate('branchId', 'name city')
      .populate({
        path: 'orderId',
        select: 'orderNumber items totalAmount createdAt'
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Customer feedback retrieved successfully',
      data: {
        count: feedback.length,
        feedback
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all feedback across all branches (Manager/Admin)
 * @route   GET /api/feedback
 * @access  Private (Manager, Admin)
 */
const getAllFeedback = async (req, res, next) => {
  try {
    const { branchId, minRating } = req.query;
    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (minRating) filter.rating = { $gte: Number(minRating) };

    const feedback = await Feedback.find(filter)
      .populate('customerId', 'name email')
      .populate('branchId', 'name city')
      .populate('orderId', 'orderNumber totalAmount')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All feedback records retrieved',
      data: {
        count: feedback.length,
        feedback
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  submitFeedback,
  getFeedbackByBranch,
  getMyFeedback,
  getAllFeedback
};
