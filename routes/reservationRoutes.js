/**
 * Reservation Routes
 * Module 4: Table Reservation Engine
 * Module 9: Reservation Cancellation Policy
 */

const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');
const { verifyAuth, authorizeRoles } = require('../middleware/auth');
const { validate, reservationRules } = require('../middleware/validate');
const { ROLES } = require('../config/constants');

// Public / Authenticated slot check
router.get('/available-slots', reservationController.getAvailableSlots);

// Authenticated customer/staff reservation actions
router.post('/', verifyAuth, reservationRules, validate, reservationController.createReservation);
router.get('/', verifyAuth, reservationController.getAllReservations);
router.get('/:id', verifyAuth, reservationController.getReservationById);
router.post('/:id/cancel', verifyAuth, reservationController.cancelReservation);
router.post('/:id/reschedule', verifyAuth, reservationController.rescheduleReservation);

// Staff status update
router.put('/:id/status', verifyAuth, authorizeRoles(ROLES.MANAGER, ROLES.ADMIN), reservationController.updateReservationStatus);

module.exports = router;
