import { api, csrf } from './api';

export const productService = {
  async list(page = 1) {
    return api(`/products?page=${page}`);
  },

  async get(identifier) {
    return api(`/products/${identifier}`);
  },
};

export const categoryService = {
  async list() {
    return api('/categories');
  },
};

export const collectionService = {
  async list(page = 1) {
    return api(`/collections?page=${page}`);
  },

  async get(identifier) {
    return api(`/collections/${identifier}`);
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