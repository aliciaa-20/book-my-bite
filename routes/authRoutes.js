/**
 * Auth & User Routes
 * Module 1: Customer Registration & Authentication
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyAuth, authorizeRoles } = require('../middleware/auth');
const { validate, registerRules, loginRules } = require('../middleware/validate');
const { ROLES } = require('../config/constants');

// Public routes
router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);

// Private authenticated routes
router.get('/profile', verifyAuth, authController.getProfile);
router.put('/profile', verifyAuth, authController.updateProfile);

// Admin only routes
router.get('/users', verifyAuth, authorizeRoles(ROLES.ADMIN), authController.getAllUsers);

module.exports = router;
