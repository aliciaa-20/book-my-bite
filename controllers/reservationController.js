/**
 * Table Reservation Engine & Cancellation Policy Controller
 * Module 4: Table Reservation Engine
 * Module 9: Reservation Cancellation Policy
 */

const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const Branch = require('../models/Branch');
const { RESERVATION_STATUS, ROLES } = require('../config/constants');

/**
 * Standard Available Slots List
 */
const TIME_SLOTS = [
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30'
];

/**
 * @desc    Create / Reserve a table slot (Double-booking prevention)
 * @route   POST /api/reservations
 * @access  Private (Customer, Manager, Admin)
 */
const createReservation = async (req, res, next) => {
  try {
    const { branchId, tableId, reservationDate, timeSlot, guestsCount, specialRequests } = req.body;
    const customerId = req.user.role === ROLES.CUSTOMER ? req.user._id : (req.body.customerId || req.user._id);

    // 1. Verify branch exists and is active
    const branch = await Branch.findById(branchId);
    if (!branch || !branch.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Selected restaurant branch is not available',
        errorCode: 'BRANCH_NOT_FOUND'
      });
    }

    let assignedTableId = tableId;

    // 2. If tableId specified, validate capacity and availability
    if (assignedTableId) {
      const targetTable = await Table.findOne({ _id: assignedTableId, branchId, isActive: true });
      if (!targetTable) {
        return res.status(404).json({
          success: false,
          message: 'Requested table not found in this branch',
          errorCode: 'TABLE_NOT_FOUND'
        });
      }

      if (targetTable.capacity < guestsCount) {
        return res.status(400).json({
          success: false,
          message: `Table capacity (${targetTable.capacity}) is insufficient for ${guestsCount} guests`,
          errorCode: 'INSUFFICIENT_TABLE_CAPACITY'
        });
      }

      // Check slot conflict on this table
      const conflict = await Reservation.findOne({
        tableId: assignedTableId,
        reservationDate,
        timeSlot,
        status: { $in: [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.SEATED] }
      });

      if (conflict) {
        return res.status(409).json({
          success: false,
          message: `Table ${targetTable.tableNumber} is already reserved for ${reservationDate} at ${timeSlot}. Please select another table or time slot.`,
          errorCode: 'TABLE_SLOT_CONFLICT'
        });
      }
    } else {
      // Auto-assign best-fit available table
      const bookedReservations = await Reservation.find({
        branchId,
        reservationDate,
        timeSlot,
        status: { $in: [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.SEATED] }
      }).select('tableId');

      const bookedIds = bookedReservations.map(r => r.tableId);

      // Find smallest table that fits the party size and is not booked
      const availableTable = await Table.findOne({
        branchId,
        isActive: true,
        isAvailable: true,
        capacity: { $gte: Number(guestsCount) },
        _id: { $nin: bookedIds }
      }).sort({ capacity: 1, tableNumber: 1 });

      if (!availableTable) {
        return res.status(409).json({
          success: false,
          message: `No available tables found for ${guestsCount} guests on ${reservationDate} at ${timeSlot}. Please try a different slot.`,
          errorCode: 'NO_TABLES_AVAILABLE'
        });
      }

      assignedTableId = availableTable._id;
    }

    // 3. Create and persist reservation
    const reservation = new Reservation({
      customerId,
      branchId,
      tableId: assignedTableId,
      reservationDate,
      timeSlot,
      durationMinutes: 90,
      guestsCount,
      specialRequests: specialRequests || '',
      status: RESERVATION_STATUS.CONFIRMED
    });

    await reservation.save();

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('branchId', 'name address city')
      .populate('tableId', 'tableNumber capacity locationZone')
      .populate('customerId', 'name email phone');

    res.status(201).json({
      success: true,
      message: 'Table reserved successfully',
      data: {
        _id: reservation._id,
        reservation: populatedReservation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get available slots & table availability for a date
 * @route   GET /api/reservations/available-slots
 * @access  Public / Authenticated
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { branchId, date, guestsCount } = req.query;

    if (!branchId || !date) {
      return res.status(400).json({
        success: false,
        message: 'branchId and date (YYYY-MM-DD) query parameters are required',
        errorCode: 'MISSING_QUERY_PARAMS'
      });
    }

    const minGuests = Number(guestsCount) || 1;

    // Fetch all tables that can fit the party size in this branch
    const suitableTables = await Table.find({
      branchId,
      isActive: true,
      isAvailable: true,
      capacity: { $gte: minGuests }
    });

    // Fetch all active reservations for this branch on the given date
    const dayReservations = await Reservation.find({
      branchId,
      reservationDate: date,
      status: { $in: [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.SEATED] }
    });

    // Calculate availability per time slot
    const slotsSummary = TIME_SLOTS.map(slot => {
      const bookedInSlot = dayReservations.filter(r => r.timeSlot === slot);
      const bookedTableIds = new Set(bookedInSlot.map(r => r.tableId.toString()));
      const availableTablesInSlot = suitableTables.filter(t => !bookedTableIds.has(t._id.toString()));

      return {
        timeSlot: slot,
        isAvailable: availableTablesInSlot.length > 0,
        availableTablesCount: availableTablesInSlot.length,
        totalSuitableTables: suitableTables.length
      };
    });

    res.status(200).json({
      success: true,
      message: 'Available slots retrieved successfully',
      data: {
        date,
        branchId,
        guestsCount: minGuests,
        slots: slotsSummary
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all reservations (with filters for manager/admin)
 * @route   GET /api/reservations
 * @access  Private (Staff/Admin)
 */
const getAllReservations = async (req, res, next) => {
  try {
    const { branchId, date, status, customerId } = req.query;
    const filter = {};

    if (branchId) filter.branchId = branchId;
    if (date) filter.reservationDate = date;
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;

    // If user is a customer, enforce customerId
    if (req.user.role === ROLES.CUSTOMER) {
      filter.customerId = req.user._id;
    }

    const reservations = await Reservation.find(filter)
      .populate('branchId', 'name city address')
      .populate('tableId', 'tableNumber capacity locationZone')
      .populate('customerId', 'name email phone')
      .sort({ reservationDate: -1, timeSlot: -1 });

    res.status(200).json({
      success: true,
      message: 'Reservations retrieved successfully',
      data: {
        count: reservations.length,
        reservations
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single reservation by ID
 * @route   GET /api/reservations/:id
 * @access  Private (Owner, Staff, Admin)
 */
const getReservationById = async (req, res, next) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('branchId', 'name city address phone')
      .populate('tableId', 'tableNumber capacity locationZone')
      .populate('customerId', 'name email phone');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${req.params.id} not found`,
        errorCode: 'RESERVATION_NOT_FOUND'
      });
    }

    // Ownership check for customers
    if (req.user.role === ROLES.CUSTOMER && reservation.customerId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to view this reservation',
        errorCode: 'FORBIDDEN'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reservation details retrieved successfully',
      data: {
        reservation
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel reservation (Cancellation Policy)
 * @route   POST /api/reservations/:id/cancel
 * @access  Private (Customer owner, Manager, Admin)
 */
const cancelReservation = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${req.params.id} not found`,
        errorCode: 'RESERVATION_NOT_FOUND'
      });
    }

    // Ownership check
    if (req.user.role === ROLES.CUSTOMER && reservation.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only cancel your own reservations',
        errorCode: 'FORBIDDEN'
      });
    }

    // Check if already completed or cancelled
    if (reservation.status === RESERVATION_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'This reservation is already cancelled',
        errorCode: 'ALREADY_CANCELLED'
      });
    }

    if (reservation.status === RESERVATION_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed dining reservation',
        errorCode: 'CANNOT_CANCEL_COMPLETED'
      });
    }

    reservation.status = RESERVATION_STATUS.CANCELLED;
    reservation.cancellationReason = reason || 'Customer requested cancellation';
    reservation.cancelledAt = new Date();

    await reservation.save();

    res.status(200).json({
      success: true,
      message: 'Reservation cancelled successfully',
      data: {
        _id: reservation._id,
        status: reservation.status,
        cancellationReason: reservation.cancellationReason,
        cancelledAt: reservation.cancelledAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reschedule reservation (Reschedule Policy)
 * @route   POST /api/reservations/:id/reschedule
 * @access  Private (Customer owner, Manager, Admin)
 */
const rescheduleReservation = async (req, res, next) => {
  try {
    const { newDate, newTimeSlot, newGuestsCount } = req.body;
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: `Reservation with ID ${req.params.id} not found`,
        errorCode: 'RESERVATION_NOT_FOUND'
      });
    }

    if (req.user.role === ROLES.CUSTOMER && reservation.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only reschedule your own reservations',
        errorCode: 'FORBIDDEN'
      });
    }

    if (reservation.status === RESERVATION_STATUS.CANCELLED || reservation.status === RESERVATION_STATUS.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: `Cannot reschedule a ${reservation.status.toLowerCase()} reservation`,
        errorCode: 'INVALID_STATUS_FOR_RESCHEDULE'
      });
    }

    const targetDate = newDate || reservation.reservationDate;
    const targetSlot = newTimeSlot || reservation.timeSlot;
    const targetGuests = newGuestsCount || reservation.guestsCount;

    // Check if the current table is free at the new date/time
    const conflict = await Reservation.findOne({
      _id: { $ne: reservation._id },
      tableId: reservation.tableId,
      reservationDate: targetDate,
      timeSlot: targetSlot,
      status: { $in: [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.SEATED] }
    });

    let newTableId = reservation.tableId;

    if (conflict) {
      // Find another available table with required capacity
      const bookedReservations = await Reservation.find({
        _id: { $ne: reservation._id },
        branchId: reservation.branchId,
        reservationDate: targetDate,
        timeSlot: targetSlot,
        status: { $in: [RESERVATION_STATUS.CONFIRMED, RESERVATION_STATUS.SEATED] }
      }).select('tableId');

      const bookedIds = bookedReservations.map(r => r.tableId);

      const altTable = await Table.findOne({
        branchId: reservation.branchId,
        isActive: true,
        isAvailable: true,
        capacity: { $gte: Number(targetGuests) },
        _id: { $nin: bookedIds }
      }).sort({ capacity: 1 });

      if (!altTable) {
        return res.status(409).json({
          success: false,
          message: `No tables available on ${targetDate} at ${targetSlot} for ${targetGuests} guests.`,
          errorCode: 'RESCHEDULE_SLOT_UNAVAILABLE'
        });
      }

      newTableId = altTable._id;
    }

    reservation.reservationDate = targetDate;
    reservation.timeSlot = targetSlot;
    reservation.guestsCount = targetGuests;
    reservation.tableId = newTableId;
    reservation.status = RESERVATION_STATUS.CONFIRMED;

    await reservation.save();

    const updated = await Reservation.findById(reservation._id)
      .populate('branchId', 'name city')
      .populate('tableId', 'tableNumber capacity locationZone');

    res.status(200).json({
      success: true,
      message: 'Reservation rescheduled successfully',
      data: {
        reservation: updated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update reservation status (e.g. Seated, Completed)
 * @route   PUT /api/reservations/:id/status
 * @access  Private (Manager, Admin)
 */
const updateReservationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!Object.values(RESERVATION_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(RESERVATION_STATUS).join(', ')}`,
        errorCode: 'INVALID_STATUS'
      });
    }

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('tableId branchId customerId');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
        errorCode: 'RESERVATION_NOT_FOUND'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reservation status updated successfully',
      data: {
        status: reservation.status,
        reservation
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReservation,
  getAvailableSlots,
  getAllReservations,
  getReservationById,
  cancelReservation,
  rescheduleReservation,
  updateReservationStatus
};
