import { api, csrf } from './api';

export const adminProductService = {
  async list(page = 1) {
    return api(`/admin/products?page=${page}`);
  },

  async get(productId) {
    return api(`/admin/products/${productId}`);
  },

  async create(data) {
    await csrf();
    return api('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(productId, data) {
    await csrf();
    return api(`/admin/products/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(productId) {
    await csrf();
    return api(`/admin/products/${productId}`, { method: 'DELETE' });
  },

  
  async uploadImages(productId, formData) {
    await csrf();
    return api(`/admin/products/${productId}/images`, {
      method: 'POST',
      body: formData,
    });
  },

  async replaceImage(productId, imageId, formData) {
    await csrf();
    return api(`/admin/products/${productId}/images/${imageId}/replace`, {
      method: 'POST',
      body: formData,
    });
  },

  async updateImage(productId, imageId, data) {
    await csrf();
    return api(`/admin/products/${productId}/images/${imageId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteImage(productId, imageId) {
    await csrf();
    return api(`/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' });
  },
};

export const adminCategoryService = {
  async list() {
    return api('/admin/categories');
  },

  async get(categoryId) {
    return api(`/admin/categories/${categoryId}`);
  },

  async create(data) {
    await csrf();
    return api('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(categoryId, data) {
    await csrf();
    return api(`/admin/categories/${categoryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(categoryId) {
    await csrf();
    return api(`/admin/categories/${categoryId}`, { method: 'DELETE' });
  },
};

export const adminCollectionService = {
  async list(page = 1) {
    return api(`/admin/collections?page=${page}`);
  },

  async get(collectionId) {
    return api(`/admin/collections/${collectionId}`);
  },

  async create(data) {
    await csrf();
    return api('/admin/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(collectionId, data) {
    await csrf();
    return api(`/admin/collections/${collectionId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(collectionId) {
    await csrf();
    return api(`/admin/collections/${collectionId}`, { method: 'DELETE' });
  },
};

export const adminOfferService = {
  async list(page = 1) {
    return api(`/admin/offers?page=${page}`);
  },

  async get(offerId) {
    return api(`/admin/offers/${offerId}`);
  },

  async create(data) {
    await csrf();
    return api('/admin/offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(offerId, data) {
    await csrf();
    return api(`/admin/offers/${offerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(offerId) {
    await csrf();
    return api(`/admin/offers/${offerId}`, { method: 'DELETE' });
  },
};

export const adminCouponService = {
  async list(page = 1) {
    return api(`/admin/coupons?page=${page}`);
  },

  async get(couponId) {
    return api(`/admin/coupons/${couponId}`);
  },

  async create(data) {
    await csrf();
    return api('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(couponId, data) {
    await csrf();
    return api(`/admin/coupons/${couponId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(couponId) {
    await csrf();
    return api(`/admin/coupons/${couponId}`, { method: 'DELETE' });
  },
};

export const adminReviewService = {
  async list(page = 1) {
    return api(`/admin/reviews?page=${page}`);
  },

  async moderate(reviewId, status) {
    await csrf();
    return api(`/admin/reviews/${reviewId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};

export const adminOrderService = {
  async list(page = 1) {
    return api(`/admin/orders?page=${page}`);
  },

  async get(orderId) {
    return api(`/admin/orders/${orderId}`);
  },
};

export const adminShippingMethodService = {
  async list() {
    return api('/admin/shipping-methods');
  },

  async get(id) {
    return api(`/admin/shipping-methods/${id}`);
  },

  async create(data) {
    await csrf();
    return api('/admin/shipping-methods', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id, data) {
    await csrf();
    return api(`/admin/shipping-methods/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async setDefault(id) {
    await csrf();
    return api(`/admin/shipping-methods/${id}/default`, { method: 'PATCH' });
  },

  async delete(id) {
    await csrf();
    return api(`/admin/shipping-methods/${id}`, { method: 'DELETE' });
  },
};

export const adminUserService = {
  async list(page = 1) {
    return api(`/admin/users?page=${page}`);
  },

  async get(userId) {
    return api(`/admin/users/${userId}`);
  },

  async create(data) {
    await csrf();
    return api('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(userId, data) {
    await csrf();
    return api(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async delete(userId) {
    await csrf();
    return api(`/admin/users/${userId}`, { method: 'DELETE' });
  },

  async activate(userId) {
    await csrf();
    return api(`/admin/users/${userId}/activate`, { method: 'PATCH' });
  },

  async deactivate(userId) {
    await csrf();
    return api(`/admin/users/${userId}/deactivate`, { method: 'PATCH' });
  },
};

export const adminInvitationService = {
  async list(page = 1) {
    return api(`/admin/invitations?page=${page}`);
  },

  async create(data) {
    await csrf();
    return api('/admin/invitations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async approve(invitationId) {
    await csrf();
    return api(`/admin/invitations/${invitationId}/approve`, { method: 'POST' });
  },

  async reject(invitationId) {
    await csrf();
    return api(`/admin/invitations/${invitationId}/reject`, { method: 'POST' });
  },

  async revoke(invitationId) {
    await csrf();
    return api(`/admin/invitations/${invitationId}/revoke`, { method: 'POST' });
  },
};

export const adminPaymentService = {
  async refund(paymentId, amount) {
    await csrf();
    return api(`/admin/payments/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },
};