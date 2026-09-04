/**
 * Feedback & Rating Routes
 * Module 11: Feedback & Rating Module
 */

const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { verifyAuth, authorizeRoles } = require('../middleware/auth');
const { validate, feedbackRules } = require('../middleware/validate');
const { ROLES } = require('../config/constants');

// Public branch ratings query
router.get('/branch/:branchId', feedbackController.getFeedbackByBranch);

// Customer feedback
router.post('/', verifyAuth, authorizeRoles(ROLES.CUSTOMER, ROLES.ADMIN), feedbackRules, validate, feedbackController.submitFeedback);
router.get('/my-feedback', verifyAuth, feedbackController.getMyFeedback);

// Manager / Admin review overview
router.get('/', verifyAuth, authorizeRoles(ROLES.MANAGER, ROLES.ADMIN), feedbackController.getAllFeedback);

module.exports = router;
