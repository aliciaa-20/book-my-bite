/**
 * API Root Router
 * P07 - Restaurant Table Reservation & Food Ordering System
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const branchRoutes = require('./branchRoutes');
const tableRoutes = require('./tableRoutes');
const menuRoutes = require('./menuRoutes');
const reservationRoutes = require('./reservationRoutes');
const orderRoutes = require('./orderRoutes');
const kitchenRoutes = require('./kitchenRoutes');
const billingRoutes = require('./billingRoutes');
const feedbackRoutes = require('./feedbackRoutes');
const reportRoutes = require('./reportRoutes');

// Module Route Mappings
router.use('/auth', authRoutes);               // Module 1: Customer Registration & Auth
router.use('/branches', branchRoutes);       // Module 12: Branch Management
router.use('/tables', tableRoutes);           // Module 3: Table Inventory Management
router.use('/menu', menuRoutes);               // Module 2: Menu Management
router.use('/reservations', reservationRoutes); // Modules 4 & 9: Reservation Engine & Cancellation Policy
router.use('/orders', orderRoutes);           // Modules 5, 6, 10: Food Order Placement, Workflow & History
router.use('/kitchen', kitchenRoutes);         // Module 7: Kitchen Display Queue APIs
router.use('/billing', billingRoutes);         // Module 8: Billing & Order Summary
router.use('/feedback', feedbackRoutes);       // Module 11: Feedback & Rating Module
router.use('/reports', reportRoutes);         // Module 13: Manager Reports & Analytics

// API Health Check & Info
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Restaurant Management API is live and operational',
    data: {
      timestamp: new Date().toISOString(),
      service: 'P07 Restaurant Table Reservation & Food Ordering System',
      modules: 13,
      version: '1.0.0'
    }
  });
});

module.exports = router;
