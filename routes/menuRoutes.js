/**
 * Menu Management Routes
 * Module 2: Menu Management
 */

const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { verifyAuth, authorizeRoles } = require('../middleware/auth');
const { validate, menuItemRules } = require('../middleware/validate');
const { ROLES } = require('../config/constants');

// Public routes
router.get('/', menuController.getMenu);
router.get('/categories', menuController.getCategories);
router.get('/:id', menuController.getMenuItemById);

// Protected routes (Manager, Admin, Kitchen)
router.post('/', verifyAuth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), menuItemRules, validate, menuController.createMenuItem);
router.put('/:id', verifyAuth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), menuController.updateMenuItem);
router.patch('/:id/toggle-availability', verifyAuth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER, ROLES.KITCHEN), menuController.toggleAvailability);
router.delete('/:id', verifyAuth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), menuController.deleteMenuItem);

module.exports = router;
