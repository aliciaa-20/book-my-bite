/**
 * Kitchen Display System Routes
 * Module 7: Kitchen Display Queue APIs
 */

const express = require('express');
const router = express.Router();
const kitchenController = require('../controllers/kitchenController');
const { verifyAuth, authorizeRoles } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Restrict all kitchen routes to Kitchen Staff, Managers, and Admins
router.use(verifyAuth, authorizeRoles(ROLES.KITCHEN, ROLES.MANAGER, ROLES.ADMIN));

router.get('/queue', kitchenController.getKitchenQueue);
router.put('/orders/:id/status', kitchenController.updateKitchenOrderStatus);
router.get('/metrics', kitchenController.getKitchenMetrics);

module.exports = router;
