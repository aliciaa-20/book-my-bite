/**
 * Manager Reports & Analytics Controller
 * Module 13: Manager Reports & Analytics
 */

const mongoose = require('mongoose');
const Order = require('../models/Order');
const Reservation = require('../models/Reservation');
const Feedback = require('../models/Feedback');
const Branch = require('../models/Branch');
const Table = require('../models/Table');
const { ORDER_STATUS, RESERVATION_STATUS } = require('../config/constants');

/**
 * @desc    Get sales and revenue analytics by branch and time range
 * @route   GET /api/reports/sales
 * @access  Private (Manager, Admin)
 */
const getSalesAnalytics = async (req, res, next) => {
  try {
    const { branchId, startDate, endDate } = req.query;
    const matchStage = {
      status: { $in: [ORDER_STATUS.SERVED, ORDER_STATUS.DELIVERED, ORDER_STATUS.READY, ORDER_STATUS.PREPARING, ORDER_STATUS.PLACED] }
    };

    if (branchId) {
      matchStage.branchId = new mongoose.Types.ObjectId(branchId);
    }

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchStage.createdAt.$lte = end;
      }
    }

    // Aggregation 1: Branch-wise sales breakdown
    const branchSales = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$branchId',
          totalRevenue: { $sum: '$totalAmount' },
          totalTax: { $sum: '$taxAmount' },
          totalServiceCharge: { $sum: '$serviceCharge' },
          totalDiscounts: { $sum: '$discountAmount' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' }
        }
      },
      {
        $lookup: {
          from: 'branches',
          localField: '_id',
          foreignField: '_id',
          as: 'branch'
        }
      },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          branchId: '$_id',
          branchName: { $ifNull: ['$branch.name', 'Global/All'] },
          branchCity: { $ifNull: ['$branch.city', 'N/A'] },
          totalRevenue: { $round: ['$totalRevenue', 2] },
          totalTax: { $round: ['$totalTax', 2] },
          totalServiceCharge: { $round: ['$totalServiceCharge', 2] },
          totalDiscounts: { $round: ['$totalDiscounts', 2] },
          orderCount: 1,
          avgOrderValue: { $round: ['$avgOrderValue', 2] }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Aggregation 2: Daily sales trend
    const dailySales = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          revenue: { $round: ['$revenue', 2] },
          orders: 1,
          _id: 0
        }
      }
    ]);

    // Aggregation 3: Dine-In vs Takeaway distribution
    const orderTypeSplit = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$orderType',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ]);

    const grandTotalRevenue = branchSales.reduce((acc, b) => acc + b.totalRevenue, 0);
    const grandTotalOrders = branchSales.reduce((acc, b) => acc + b.orderCount, 0);

    res.status(200).json({
      success: true,
      message: 'Sales analytics retrieved successfully',
      data: {
        summary: {
          grandTotalRevenue: Math.round(grandTotalRevenue * 100) / 100,
          grandTotalOrders,
          averageOrderValue: grandTotalOrders > 0 ? Math.round((grandTotalRevenue / grandTotalOrders) * 100) / 100 : 0
        },
        branchSales,
        dailySales,
        orderTypeSplit
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get top-selling / popular dishes report
 * @route   GET /api/reports/popular-dishes
 * @access  Private (Manager, Admin)
 */
const getPopularDishes = async (req, res, next) => {
  try {
    const { branchId, limit } = req.query;
    const matchStage = {
      status: { $nin: [ORDER_STATUS.CANCELLED] }
    };

    if (branchId) {
      matchStage.branchId = new mongoose.Types.ObjectId(branchId);
    }

    const popularDishes = await Order.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.menuItemId',
          dishName: { $first: '$items.name' },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
          orderAppearances: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'menuitems',
          localField: '_id',
          foreignField: '_id',
          as: 'menuItemDetails'
        }
      },
      { $unwind: { path: '$menuItemDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          menuItemId: '$_id',
          name: '$dishName',
          category: '$menuItemDetails.category',
          isVeg: '$menuItemDetails.isVeg',
          price: '$menuItemDetails.price',
          ratingAverage: '$menuItemDetails.ratingAverage',
          totalQuantitySold: 1,
          totalRevenue: { $round: ['$totalRevenue', 2] },
          orderAppearances: 1
        }
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: Number(limit) || 10 }
    ]);

    res.status(200).json({
      success: true,
      message: 'Popular dishes report retrieved successfully',
      data: {
        count: popularDishes.length,
        popularDishes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get peak dining and order placement hours
 * @route   GET /api/reports/peak-hours
 * @access  Private (Manager, Admin)
 */
const getPeakHours = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const matchStage = { status: { $nin: [ORDER_STATUS.CANCELLED] } };
    if (branchId) matchStage.branchId = new mongoose.Types.ObjectId(branchId);

    // Group orders by hour of the day (0-23)
    const hourlyOrders = await Order.aggregate([
      { $match: matchStage },
      {
        $project: {
          hour: { $hour: '$createdAt' },
          totalAmount: 1
        }
      },
      {
        $group: {
          _id: '$hour',
          orderCount: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          hour: '$_id',
          formattedHour: {
            $concat: [
              { $toString: '$_id' },
              ':00 - ',
              { $toString: { $add: ['$_id', 1] } },
              ':00'
            ]
          },
          orderCount: 1,
          revenue: { $round: ['$revenue', 2] },
          _id: 0
        }
      }
    ]);

    // Group reservations by time slot
    const resMatch = { status: { $ne: RESERVATION_STATUS.CANCELLED } };
    if (branchId) resMatch.branchId = new mongoose.Types.ObjectId(branchId);

    const slotReservations = await Reservation.aggregate([
      { $match: resMatch },
      {
        $group: {
          _id: '$timeSlot',
          reservationCount: { $sum: 1 },
          totalGuests: { $sum: '$guestsCount' }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          timeSlot: '$_id',
          reservationCount: 1,
          totalGuests: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Peak hours analytics retrieved successfully',
      data: {
        hourlyOrders,
        slotReservations
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get executive manager dashboard summary KPIs
 * @route   GET /api/reports/dashboard-summary
 * @access  Private (Manager, Admin)
 */
const getDashboardSummary = async (req, res, next) => {
  try {
    const { branchId } = req.query;
    const filter = {};
    if (branchId) filter.branchId = branchId;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalBranches,
      totalTables,
      activeReservationsCount,
      todayOrders,
      allOrders,
      avgFeedback
    ] = await Promise.all([
      Branch.countDocuments({ isActive: true }),
      Table.countDocuments({ ...filter, isActive: true }),
      Reservation.countDocuments({
        ...filter,
        status: { $in: [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.SEATED] }
      }),
      Order.find({
        ...filter,
        createdAt: { $gte: today },
        status: { $ne: ORDER_STATUS.CANCELLED }
      }),
      Order.find({
        ...filter,
        status: { $ne: ORDER_STATUS.CANCELLED }
      }),
      Feedback.aggregate([
        ...(branchId ? [{ $match: { branchId: new mongoose.Types.ObjectId(branchId) } }] : []),
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            avgFood: { $avg: '$foodRating' },
            avgService: { $avg: '$serviceRating' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    const todayRevenue = todayOrders.reduce((acc, o) => acc + o.totalAmount, 0);
    const totalLifetimeRevenue = allOrders.reduce((acc, o) => acc + o.totalAmount, 0);

    res.status(200).json({
      success: true,
      message: 'Dashboard KPIs retrieved successfully',
      data: {
        totalBranches,
        totalTables,
        activeReservations: activeReservationsCount,
        todayOrdersCount: todayOrders.length,
        todayRevenue: Math.round(todayRevenue * 100) / 100,
        totalLifetimeRevenue: Math.round(totalLifetimeRevenue * 100) / 100,
        customerSatisfaction: {
          averageRating: avgFeedback.length ? Math.round(avgFeedback[0].avgRating * 10) / 10 : 4.7,
          totalReviews: avgFeedback.length ? avgFeedback[0].count : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesAnalytics,
  getPopularDishes,
  getPeakHours,
  getDashboardSummary
};
