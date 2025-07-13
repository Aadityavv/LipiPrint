import RazorpayCheckout from 'react-native-razorpay';
import { PRODUCTION_CONFIG } from '../config/production';
import ApiService from './api';

export async function createRazorpayOrder({ amount, currency = 'INR', receipt = 'receipt#1' }) {
  // amount in rupees, backend expects paise
  const res = await ApiService.request('/orders/create-razorpay-order', {
    method: 'POST',
    body: JSON.stringify({ amount: Math.round(amount * 100), currency, receipt }),
  });
  return res;
}

export function launchRazorpay({ amount, name, email, contact, description, orderId }) {
  return new Promise((resolve, reject) => {
    const options = {
      description: description || 'LipiPrint Order',
      image: undefined,
      currency: PRODUCTION_CONFIG.PAYMENT.RAZORPAY.CURRENCY,
      key: PRODUCTION_CONFIG.PAYMENT.RAZORPAY.KEY_ID,
      amount: Math.round(amount * 100), // Razorpay expects paise
      name: name || 'LipiPrint',
      order_id: orderId, // Razorpay order_id if generated from backend
      prefill: {
        email: email || '',
        contact: contact || '',
        name: name || '',
      },
      theme: { color: '#667eea' },
    };
    RazorpayCheckout.open(options)
      .then(data => resolve(data))
      .catch(error => reject(error));
  });
}
