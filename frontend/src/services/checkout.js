import { api, csrf } from './api';

export const checkoutService = {
  async create(data) {
    await csrf();

    return api('/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export const paymentService = {
  async initiate(paymentId) {
    await csrf();

    return api(`/payments/${paymentId}/initiate`, {
      method: 'POST',
    });
  },
};

export const orderService = {
  async list() {
    return api('/orders');
  },

  async get(orderId) {
    return api(`/orders/${orderId}`);
  },
};