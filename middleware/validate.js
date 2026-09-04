/**
 * Request Validation Middleware using express-validator
 * P07 - Restaurant Table Reservation & Food Ordering System
 */

const { validationResult, body, param, query } = require('express-validator');

/**
 * Middleware that checks for validation errors from express-validator
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: formattedErrors[0].message || 'Validation failed for the submitted data',
      errorCode: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  }
  next();
};

// --- Validation Rule Sets ---

const registerRules = [
  body('name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('role').optional().isIn(['customer', 'kitchen', 'manager', 'admin']).withMessage('Role must be customer, kitchen, manager, or admin'),
  body('phone').optional().trim()
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const branchRules = [
  body('name').trim().notEmpty().withMessage('Branch name is required'),
  body('address').trim().notEmpty().withMessage('Branch address is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('phone').trim().notEmpty().withMessage('Contact phone is required'),
  body('seatingCapacity').isInt({ min: 1 }).withMessage('Seating capacity must be a positive integer'),
  body('openingTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Opening time must be HH:MM format'),
  body('closingTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Closing time must be HH:MM format')
];

const tableRules = [
  body('branchId').isMongoId().withMessage('Valid branchId is required'),
  body('tableNumber').trim().notEmpty().withMessage('Table number is required'),
  body('capacity').isInt({ min: 1, max: 20 }).withMessage('Capacity must be between 1 and 20 seats'),
  body('locationZone').optional().isIn(['Indoor Main Hall', 'Outdoor Patio', 'Rooftop Garden', 'VIP Lounge']).withMessage('Invalid location zone')
];

const menuItemRules = [
  body('branchId').optional().isMongoId().withMessage('Valid branchId is required'),
  body('name').trim().notEmpty().withMessage('Menu item name is required'),
  body('category').isIn(['Starters', 'Main Course', 'Breads & Rice', 'Desserts', 'Beverages', 'Chef Specials']).withMessage('Invalid menu category'),
  body('price').isFloat({ min: 0.01 }).withMessage('Price must be greater than 0'),
  body('description').optional().trim(),
  body('isVeg').optional().isBoolean().withMessage('isVeg must be boolean'),
  body('preparationTime').optional().isInt({ min: 1 }).withMessage('Preparation time must be at least 1 minute')
];

const reservationRules = [
  body('branchId').isMongoId().withMessage('Valid branchId is required'),
  body('tableId').optional().isMongoId().withMessage('Valid tableId is required'),
  body('reservationDate').isISO8601().withMessage('Valid reservation date (YYYY-MM-DD) is required'),
  body('timeSlot').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Time slot must be in HH:MM format'),
  body('guestsCount').isInt({ min: 1, max: 20 }).withMessage('Guest count must be between 1 and 20'),
  body('specialRequests').optional().trim()
];

const orderRules = [
  body('branchId').isMongoId().withMessage('Valid branchId is required'),
  body('orderType').isIn(['Dine-In', 'Takeaway']).withMessage('Order type must be Dine-In or Takeaway'),
  body('tableId').optional().isMongoId().withMessage('Table ID must be a valid ObjectId'),
  body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
  body('items.*.menuItemId').isMongoId().withMessage('Each item must have a valid menuItemId'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Item quantity must be at least 1'),
  body('items.*.specialNotes').optional().trim(),
  body('promoCode').optional().trim()
];

const updateOrderStatusRules = [
  body('status').isIn(['Placed', 'Preparing', 'Ready', 'Served', 'Delivered', 'Cancelled']).withMessage('Invalid order status'),
  body('remarks').optional().trim()
];

const feedbackRules = [
  body('orderId').isMongoId().withMessage('Valid orderId is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
  body('foodRating').optional().isInt({ min: 1, max: 5 }).withMessage('Food rating must be between 1 and 5'),
  body('serviceRating').optional().isInt({ min: 1, max: 5 }).withMessage('Service rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 500 }).withMessage('Comment must not exceed 500 characters')
];

module.exports = {
  validate,
  registerRules,
  loginRules,
  branchRules,
  tableRules,
  menuItemRules,
  reservationRules,
  orderRules,
  updateOrderStatusRules,
  feedbackRules
};
