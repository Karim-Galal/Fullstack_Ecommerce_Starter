import { api, csrf } from './api';

export const reviewService = {
  async list(productId, page = 1) {
    const params = new URLSearchParams({ page: page.toString() });
    if (productId) params.set('product_id', productId);
    return api(`/reviews?${params.toString()}`);
  },

  async myReviews(page = 1) {
    await csrf();
    return api(`/reviews/mine?page=${page}`);
  },

  async get(reviewId) {
    return api(`/reviews/${reviewId}`);
  },

  async create(data) {
    await csrf();
    return api('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(reviewId, data) {
    await csrf();
    return api(`/reviews/${reviewId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(reviewId) {
    await csrf();
    return api(`/reviews/${reviewId}`, { method: 'DELETE' });
  },
};

export const wishlistService = {
  async get() {
    await csrf();
    return api('/wishlist');
  },

  async add(productId) {
    await csrf();
    return api('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId }),
    });
  },

  async remove(productId) {
    await csrf();
    return api(`/wishlist/${productId}`, { method: 'DELETE' });
  },
};

export const addressService = {
  async list() {
    await csrf();
    return api('/addresses');
  },

  async get(addressId) {
    await csrf();
    return api(`/addresses/${addressId}`);
  },

  async create(data) {
    await csrf();
    return api('/addresses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(addressId, data) {
    await csrf();
    return api(`/addresses/${addressId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(addressId) {
    await csrf();
    return api(`/addresses/${addressId}`, { method: 'DELETE' });
  },

  async setDefault(addressId) {
    await csrf();
    return api(`/addresses/${addressId}/default`, { method: 'PATCH' });
  },
};