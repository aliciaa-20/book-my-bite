/**
 * Table Inventory Routes
 * Module 3: Table Inventory Management
 */

const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { verifyAuth, authorizeRoles } = require('../middleware/auth');
const { validate, tableRules } = require('../middleware/validate');
const { ROLES } = require('../config/constants');

// Public / Authenticated queries
router.get('/', tableController.getTables);
router.get('/available', tableController.getAvailableTables);
router.get('/zones', tableController.getTableZones);
router.get('/:id', tableController.getTableById);

// Manager / Admin table configuration
router.post('/', verifyAuth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), tableRules, validate, tableController.createTable);
router.put('/:id', verifyAuth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), tableController.updateTable);
router.delete('/:id', verifyAuth, authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), tableController.deleteTable);

module.exports = router;
