import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

function calculateCart(items = []) {
  return {
    items,
    itemCount: items.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    ),
    subtotal: items.reduce(
      (sum, item) =>
        sum +
        Number(item.product?.price || 0) *
          Number(item.quantity || 0),
      0,
    ),
  };
}

export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: null,
      items: [],
      itemCount: 0,
      subtotal: 0,
      isLoading: false,
      error: null,

      setCart: (response) => {
        const cart = response?.cart ?? response ?? null;
        const items = Array.isArray(cart?.items) ? cart.items : [];

        set({
          cart: cart?.id ? cart : null,
          ...calculateCart(items),
        });
      },

      addItem: (item) => {
        const { items } = get();
        const existing = items.find(
          (current) => current.product_id === item.product_id,
        );

        const newItems = existing
          ? items.map((current) =>
              current.product_id === item.product_id
                ? { ...current, quantity: current.quantity + item.quantity }
                : current,
            )
          : [...items, item];

        set(calculateCart(newItems));
      },

      updateQuantity: (itemId, quantity) => {
        const items = get().items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item,
        );

        set(calculateCart(items.filter((item) => item.quantity > 0)));
      },

      removeItem: (itemId) => {
        const items = get().items.filter((item) => item.id !== itemId);

        set(calculateCart(items));
      },

      clearCart: () =>
        set({
          cart: null,
          items: [],
          itemCount: 0,
          subtotal: 0,
          error: null,
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setCart({ items: state.items });
        }
      },
    },
  ),
);