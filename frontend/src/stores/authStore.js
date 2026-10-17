import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      logout: () => set({ user: null, isAuthenticated: false }),

      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'master_admin') return true;
        if (user.role !== 'staff') return false;
        return user.permissions?.includes(permission) ?? false;
      },

      canAdmin: (resource) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'master_admin' && user.status === 'active') return true;
        if (user.role === 'staff' && user.status === 'active') {
          return user.permissions?.includes(`${resource}.*`) ?? false;
        }
        return false;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);