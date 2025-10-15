/**
 * Price utility functions for consistent price formatting and rounding
 */

/**
 * Rounds the price according to Indian paise rounding rules:
 * - If paise >= 50, round up to next rupee
 * - If paise < 50, round down (truncate)
 * 
 * @param {number} amount - The amount to round
 * @returns {number} - The rounded amount
 */
export const roundIndianPrice = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 0;
  }
  
  // Get the decimal part (paise)
  const decimalPart = amount - Math.floor(amount);
  
  // If paise >= 0.50, round up; otherwise round down
  if (decimalPart >= 0.50) {
    return Math.ceil(amount);
  } else {
    return Math.floor(amount);
  }
};

/**
 * Formats a price with proper rounding and displays it as currency
 * 
 * @param {number} amount - The amount to format
 * @param {boolean} showDecimals - Whether to show decimal places (default: false for rounded amounts)
 * @returns {string} - Formatted currency string
 */
export const formatPrice = (amount, showDecimals = false) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0';
  }
  
  const roundedAmount = roundIndianPrice(amount);
  
  if (showDecimals) {
    return `₹${roundedAmount.toFixed(2)}`;
  } else {
    return `₹${roundedAmount}`;
  }
};

/**
 * Formats a price with decimals (for individual line items)
 * 
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string with decimals
 */
export const formatPriceWithDecimals = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₹0.00';
  }
  
  return `₹${amount.toFixed(2)}`;
};

/**
 * Calculates and rounds the final total for an order
 * 
 * @param {Object} orderData - Order data object
 * @returns {number} - Rounded final total
 */
export const calculateRoundedTotal = (orderData) => {
  const {
    subtotal = 0,
    discount = 0,
    gst = 0,
    cgst = 0,
    sgst = 0,
    igst = 0,
    delivery = 0,
    grandTotal = 0
  } = orderData;
  
  // Calculate total GST
  const totalGST = gst || (cgst + sgst + igst);
  
  // Calculate final total: subtotal - discount + GST + delivery
  const finalTotal = subtotal - discount + totalGST + delivery;
  
  // Return rounded total
  return roundIndianPrice(finalTotal);
};
