import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      error: null,

      setItems: (items) => set({ items }),

      addItem: (product) => {
        const { items } = get();
        if (!items.find((i) => i.product_id === product.id)) {
          set({ items: [...items, { product_id: product.id, product }] });
        }
      },

      removeItem: (productId) => {
        const { items } = get();
        set({ items: items.filter((i) => i.product_id !== productId) });
      },

      toggleItem: (product) => {
        const { items, addItem, removeItem } = get();
        const exists = items.find((i) => i.product_id === product.id);
        if (exists) {
          removeItem(product.id);
        } else {
          addItem(product);
        }
      },

      isInWishlist: (productId) => {
        const { items } = get();
        return items.some((i) => i.product_id === productId);
      },

      clearWishlist: () => set({ items: [] }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    }
  )
);