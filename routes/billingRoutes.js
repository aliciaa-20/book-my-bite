/**
 * Billing & Payment Routes
 * Module 8: Billing & Order Summary
 */

const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { verifyAuth } = require('../middleware/auth');

// Public preview calculation
router.post('/calculate', billingController.calculateBill);
router.get('/promo-codes', billingController.getAvailablePromoCodes);

// Authenticated invoice & payment
router.get('/orders/:id/invoice', verifyAuth, billingController.getOrderInvoice);
router.post('/orders/:id/pay', verifyAuth, billingController.processOrderPayment);

module.exports = router;
