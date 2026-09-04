/**
 * Food Order Routes
 * Module 5: Food Order Placement
 * Module 6: Order Status Workflow
 * Module 10: Customer Order History
 */

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyAuth, authorizeRoles } = require('../middleware/auth');
const { validate, orderRules, updateOrderStatusRules } = require('../middleware/validate');
const { ROLES } = require('../config/constants');

// Customer & staff order endpoints
router.post('/', verifyAuth, orderRules, validate, orderController.createOrder);
router.get('/my-history', verifyAuth, orderController.getCustomerOrderHistory);
router.get('/', verifyAuth, authorizeRoles(ROLES.MANAGER, ROLES.ADMIN, ROLES.KITCHEN), orderController.getAllOrders);
router.get('/:id', verifyAuth, orderController.getOrderById);
router.post('/:id/cancel', verifyAuth, orderController.cancelOrder);

// Status transition endpoint
router.put(
  '/:id/status',
  verifyAuth,
  authorizeRoles(ROLES.KITCHEN, ROLES.MANAGER, ROLES.ADMIN),
  updateOrderStatusRules,
  validate,
  orderController.updateOrderStatus
);

module.exports = router;
