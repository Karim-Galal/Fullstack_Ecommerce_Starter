import { api, csrf } from './api';

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    query.set(key, String(value));
  });

  return query.toString();
}

export const productService = {
  async list(params = {}) {
    const filters = typeof params === 'number' ? { page: params } : params;
    const query = buildQuery(filters);

    return api(`/products${query ? `?${query}` : ''}`);
  },

  async get(identifier) {
    return api(`/products/${encodeURIComponent(identifier)}`);
  },
};

export const categoryService = {
  async list() {
    return api('/categories');
  },
};

export const collectionService = {
  async list(params = {}) {
    const filters = typeof params === 'number' ? { page: params } : params;
    const query = buildQuery(filters);

    return api(`/collections${query ? `?${query}` : ''}`);
  },

  async get(identifier) {
    return api(`/collections/${encodeURIComponent(identifier)}`);
  },
};

export const cartService = {
  async get() {
    return api('/cart');
  },

  async add(productId, quantity) {
    await csrf();
    return api('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  },

  async update(itemId, quantity) {
    await csrf();
    return api(`/cart/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  },

  async remove(itemId) {
    await csrf();
    return api(`/cart/items/${itemId}`, {
      method: 'DELETE',
    });
  },
};

export const shippingMethodService = {
  async list() {
    return api('/shipping-methods');
  },
};
