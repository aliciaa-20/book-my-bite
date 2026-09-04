/**
 * Application Constants and Enums
 * P07 - Restaurant Table Reservation & Food Ordering System
 */

const ROLES = {
  CUSTOMER: 'customer',
  KITCHEN: 'kitchen',
  MANAGER: 'manager',
  ADMIN: 'admin'
};

const ORDER_STATUS = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  SERVED: 'Served',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
};

const ORDER_TYPES = {
  DINE_IN: 'Dine-In',
  TAKEAWAY: 'Takeaway'
};

const RESERVATION_STATUS = {
  CONFIRMED: 'Confirmed',
  SEATED: 'Seated',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  RESCHEDULED: 'Rescheduled'
};

const MENU_CATEGORIES = [
  'Starters',
  'Main Course',
  'Breads & Rice',
  'Desserts',
  'Beverages',
  'Chef Specials'
];

const TABLE_LOCATIONS = [
  'Indoor Main Hall',
  'Outdoor Patio',
  'Rooftop Garden',
  'VIP Lounge'
];

const PAYMENT_STATUS = {
  PENDING: 'Pending',
  PAID: 'Paid',
  REFUNDED: 'Refunded'
};

const PAYMENT_METHODS = {
  CASH: 'Cash',
  CARD: 'Card',
  UPI: 'UPI',
  ONLINE: 'Online'
};

const TAX_RATE = 0.05; // 5% GST
const SERVICE_CHARGE_RATE = 0.05; // 5% Service Charge

const PROMO_CODES = {
  'WELCOME10': { discountPercentage: 10, minOrder: 300, maxDiscount: 150 },
  'FEAST20': { discountPercentage: 20, minOrder: 800, maxDiscount: 300 },
  'FLAT50': { flatDiscount: 50, minOrder: 400 }
};

module.exports = {
  ROLES,
  ORDER_STATUS,
  ORDER_TYPES,
  RESERVATION_STATUS,
  MENU_CATEGORIES,
  TABLE_LOCATIONS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  TAX_RATE,
  SERVICE_CHARGE_RATE,
  PROMO_CODES
};
