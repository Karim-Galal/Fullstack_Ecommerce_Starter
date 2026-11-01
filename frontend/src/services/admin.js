import { api, csrf } from './api';

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (typeof value === 'boolean') {
      query.set(key, value ? '1' : '0');
      return;
    }
    query.set(key, String(value));
  });

  const queryString = query.toString();

  return queryString ? `?${queryString}` : '';
}

async function request(path, { method = 'GET', body, signal } = {}) {
  if (method !== 'GET') {
    await csrf();
  }

  return api(path, {
    method,
    signal,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

/**
 * CRUD helper shared by the admin resources that follow the same REST shape.
 * Restore/force-delete routes only exist for soft-deletable resources.
 */
function createResource(base, { restorable = true } = {}) {
  return {
    list(params = {}, { signal } = {}) {
      return api(`${base}${buildQuery(params)}`, { signal });
    },
    get(id, { signal } = {}) {
      return api(`${base}/${id}`, { signal });
    },
    create(data) {
      return request(base, { method: 'POST', body: data });
    },
    update(id, data) {
      return request(`${base}/${id}`, { method: 'PATCH', body: data });
    },
    delete(id) {
      return request(`${base}/${id}`, { method: 'DELETE' });
    },
    ...(restorable
      ? {
          restore(id) {
            return request(`${base}/${id}/restore`, { method: 'POST' });
          },
          forceDelete(id) {
            return request(`${base}/${id}/force`, { method: 'DELETE' });
          },
        }
      : {}),
  };
}

const products = createResource('/admin/products');

export const adminProductService = {
  ...products,
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
    return api(`/admin/products/${productId}/images/${imageId}`, {
      method: 'DELETE',
    });
  },
};

export const adminCategoryService = createResource('/admin/categories');

export const adminCollectionService = createResource('/admin/collections');

export const adminCouponService = createResource('/admin/coupons');

export const adminOfferService = createResource('/admin/offers');

export const adminReviewService = {
  ...createResource('/admin/reviews'),
  async moderate(reviewId, status) {
    return request(`/admin/reviews/${reviewId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },
};

export const adminOrderService = {
  list(params = {}, { signal } = {}) {
    return api(`/admin/orders${buildQuery(params)}`, { signal });
  },
  get(orderId, { signal } = {}) {
    return api(`/admin/orders/${orderId}`, { signal });
  },
  updateStatus(orderId, status) {
    return request(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },
};

export const adminPaymentService = {
  list(params = {}, { signal } = {}) {
    return api(`/admin/payments${buildQuery(params)}`, { signal });
  },
  get(paymentId, { signal } = {}) {
    return api(`/admin/payments/${paymentId}`, { signal });
  },
  refund(paymentId, amount) {
    return request(`/admin/payments/${paymentId}/refund`, {
      method: 'POST',
      body: amount === undefined || amount === null || amount === '' ? {} : { amount },
    });
  },
};

export const adminInvoiceService = {
  list(params = {}, { signal } = {}) {
    return api(`/admin/invoices${buildQuery(params)}`, { signal });
  },
  get(invoiceId, { signal } = {}) {
    return api(`/admin/invoices/${invoiceId}`, { signal });
  },
  restore(invoiceId) {
    return request(`/admin/invoices/${invoiceId}/restore`, { method: 'POST' });
  },
};

export const adminShippingMethodService = {
  ...createResource('/admin/shipping-methods', { restorable: false }),
  setDefault(id) {
    return request(`/admin/shipping-methods/${id}/default`, {
      method: 'PATCH',
    });
  },
};

export const adminUserService = {
  ...createResource('/admin/users'),
  activate(userId) {
    return request(`/admin/users/${userId}/activate`, { method: 'PATCH' });
  },
  deactivate(userId) {
    return request(`/admin/users/${userId}/deactivate`, { method: 'PATCH' });
  },
};

export const adminInvitationService = {
  list(params = {}, { signal } = {}) {
    return api(`/admin/invitations${buildQuery(params)}`, { signal });
  },
  get(invitationId, { signal } = {}) {
    return api(`/admin/invitations/${invitationId}`, { signal });
  },
  create(data) {
    return request('/admin/invitations', { method: 'POST', body: data });
  },
  approve(invitationId) {
    return request(`/admin/invitations/${invitationId}/approve`, {
      method: 'POST',
    });
  },
  reject(invitationId) {
    return request(`/admin/invitations/${invitationId}/reject`, {
      method: 'POST',
    });
  },
  revoke(invitationId) {
    return request(`/admin/invitations/${invitationId}/revoke`, {
      method: 'POST',
    });
  },
};

export const adminPermissionOptions = [
  'products.view',
  'products.create',
  'products.update',
  'products.delete',
  'categories.view',
  'categories.create',
  'categories.update',
  'categories.delete',
  'collections.view',
  'collections.create',
  'collections.update',
  'collections.delete',
  'offers.view',
  'offers.create',
  'offers.update',
  'offers.delete',
  'coupons.view',
  'coupons.create',
  'coupons.update',
  'coupons.delete',
  'reviews.view',
  'reviews.update',
  'reviews.delete',
  'shipping_methods.view',
  'shipping_methods.create',
  'shipping_methods.update',
  'shipping_methods.delete',
  'orders.view',
  'orders.update',
  'payments.view',
  'payments.refund',
  'invoices.view',
  'invoices.update',
  'users.view',
  'addresses.view',
  'addresses.update',
  'wishlists.view',
];
