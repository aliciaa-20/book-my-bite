/**
 * Billing & Pricing Calculator Utility
 * P07 - Restaurant Table Reservation & Food Ordering System
 */

const { TAX_RATE, SERVICE_CHARGE_RATE, PROMO_CODES } = require('../config/constants');

/**
 * Calculates order totals, tax, service charge, and discounts
 * @param {Array} items - Array of { price, quantity }
 * @param {string} promoCode - Optional promo code
 * @param {string} orderType - 'Dine-In' or 'Takeaway' (service charge only on Dine-In)
 */
const calculateOrderBill = (items, promoCode = null, orderType = 'Dine-In') => {
  // 1. Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + (Number(item.price) * Number(item.quantity));
  }, 0);

  // 2. Validate & apply promo code discount
  let discountAmount = 0;
  let appliedPromo = null;

  if (promoCode && PROMO_CODES[promoCode.toUpperCase()]) {
    const promo = PROMO_CODES[promoCode.toUpperCase()];
    if (subtotal >= promo.minOrder) {
      if (promo.discountPercentage) {
        discountAmount = (subtotal * promo.discountPercentage) / 100;
        if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
          discountAmount = promo.maxDiscount;
        }
      } else if (promo.flatDiscount) {
        discountAmount = promo.flatDiscount;
      }
      appliedPromo = promoCode.toUpperCase();
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);

  // 3. Taxes (GST 5%)
  const taxAmount = Math.round(discountedSubtotal * TAX_RATE * 100) / 100;

  // 4. Service charge (5% for Dine-In, 0% for Takeaway)
  const serviceCharge = (orderType === 'Dine-In') 
    ? Math.round(discountedSubtotal * SERVICE_CHARGE_RATE * 100) / 100 
    : 0;

  // 5. Total
  const totalAmount = Math.round((discountedSubtotal + taxAmount + serviceCharge) * 100) / 100;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    appliedPromo,
    taxRate: TAX_RATE,
    taxAmount,
    serviceChargeRate: (orderType === 'Dine-In') ? SERVICE_CHARGE_RATE : 0,
    serviceCharge,
    totalAmount
  };
};

module.exports = { calculateOrderBill };
