/**
 * Manager Reports & Analytics Routes
 * Module 13: Manager Reports & Analytics
 */

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyAuth, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Restrict all report endpoints to Manager and Admin
router.use(verifyAuth, authorizeRoles(ROLES.MANAGER, ROLES.ADMIN));

router.get('/sales', reportController.getSalesAnalytics);
router.get('/popular-dishes', reportController.getPopularDishes);
router.get('/peak-hours', reportController.getPeakHours);
router.get('/dashboard-summary', reportController.getDashboardSummary);

module.exports = router;
