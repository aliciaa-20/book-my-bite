/**
 * Table Inventory Management Controller
 * Module 3: Table Inventory Management
 */

const Table = require('../models/Table');
const Reservation = require('../models/Reservation');
const { RESERVATION_STATUS, TABLE_LOCATIONS } = require('../config/constants');

/**
 * @desc    Get all tables for a branch or all branches
 * @route   GET /api/tables
 * @access  Public / Authenticated
 */
const getTables = async (req, res, next) => {
  try {
    const { branchId, locationZone, isAvailable, minCapacity } = req.query;
    const filter = { isActive: true };

    if (branchId) filter.branchId = branchId;
    if (locationZone) filter.locationZone = locationZone;
    if (isAvailable !== undefined && isAvailable !== '') filter.isAvailable = isAvailable === 'true';
    if (minCapacity) filter.capacity = { $gte: Number(minCapacity) };

    const tables = await Table.find(filter)
      .populate('branchId', 'name city')
      .sort({ branchId: 1, tableNumber: 1 });

    res.status(200).json({
      success: true,
      message: 'Tables retrieved successfully',
      data: {
        count: tables.length,
        tables
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single table by ID
 * @route   GET /api/tables/:id
 * @access  Public / Authenticated
 */
const getTableById = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id).populate('branchId', 'name city');
    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Table with ID ${req.params.id} not found`,
        errorCode: 'TABLE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Table retrieved successfully',
      data: {
        table
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new table in a branch
 * @route   POST /api/tables
 * @access  Private (Manager, Admin)
 */
const createTable = async (req, res, next) => {
  try {
    const { branchId, tableNumber, capacity, locationZone } = req.body;

    // Check if tableNumber already exists for this branch
    const existingTable = await Table.findOne({ branchId, tableNumber: tableNumber.trim(), isActive: true });
    if (existingTable) {
      return res.status(409).json({
        success: false,
        message: `Table number '${tableNumber}' already exists in this branch.`,
        errorCode: 'DUPLICATE_TABLE_NUMBER'
      });
    }

    const table = new Table({
      branchId,
      tableNumber: tableNumber.trim(),
      capacity,
      locationZone: locationZone || 'Indoor Main Hall'
    });

    await table.save();

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: {
        _id: table._id,
        table
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update table details
 * @route   PUT /api/tables/:id
 * @access  Private (Manager, Admin)
 */
const updateTable = async (req, res, next) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Table with ID ${req.params.id} not found`,
        errorCode: 'TABLE_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Table updated successfully',
      data: {
        table
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete (soft-delete) table
 * @route   DELETE /api/tables/:id
 * @access  Private (Manager, Admin)
 */
const deleteTable = async (req, res, next) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: `Table with ID ${req.params.id} not found`,
        errorCode: 'TABLE_NOT_FOUND'
      });
    }

    table.isActive = false;
    await table.save();

    res.status(200).json({
      success: true,
      message: 'Table removed successfully',
      data: {
        _id: table._id
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get list of available tables for a given branch, date, timeSlot, and party size
 * @route   GET /api/tables/available
 * @access  Public / Authenticated
 */
const getAvailableTables = async (req, res, next) => {
  try {
    const { branchId, date, timeSlot, guestsCount } = req.query;

    if (!branchId || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'branchId, date (YYYY-MM-DD), and timeSlot (HH:MM) query parameters are required',
        errorCode: 'MISSING_QUERY_PARAMS'
      });
    }

    // 1. Find all active tables in branch with enough capacity
    const tableFilter = { branchId, isActive: true, isAvailable: true };
    if (guestsCount) {
      tableFilter.capacity = { $gte: Number(guestsCount) };
    }

    const allBranchTables = await Table.find(tableFilter).sort({ capacity: 1, tableNumber: 1 });

    // 2. Find tables that are already booked for this date and timeSlot
    const activeReservations = await Reservation.find({
      branchId,
      reservationDate: date,
      timeSlot,
      status: { $in: [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.SEATED] }
    }).select('tableId');

    const bookedTableIds = new Set(activeReservations.map(r => r.tableId.toString()));

    // 3. Filter out booked tables
    const availableTables = allBranchTables.filter(t => !bookedTableIds.has(t._id.toString()));

    res.status(200).json({
      success: true,
      message: 'Available tables retrieved successfully',
      data: {
        totalBranchTables: allBranchTables.length,
        availableCount: availableTables.length,
        availableTables
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get table locations/zones list
 * @route   GET /api/tables/zones
 * @access  Public
 */
const getTableZones = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Table zones retrieved successfully',
    data: {
      zones: TABLE_LOCATIONS
    }
  });
};

module.exports = {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  getAvailableTables,
  getTableZones
};
