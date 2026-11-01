import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { authService } from '@/services/auth';

/**
 * Frontend admin eligibility.
 *
 * Mirrors the backend `User::isMasterAdmin()` / `User::isActiveStaff()` rules.
 * This only controls UI access; Laravel policies remain authoritative.
 */
export function isAdminUser(user) {
  return (
    !!user &&
    user.status === 'active' &&
    (user.role === 'master_admin' || user.role === 'staff')
  );
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      // idle | checking | authenticated | unauthenticated | error
      sessionStatus: 'idle',

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          sessionStatus: user ? 'authenticated' : 'unauthenticated',
        }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      clearError: () => set({ error: null }),

      /**
       * Revalidate the persisted user against the Sanctum session.
       * Only a 401 clears the local session; 403/422 and network failures are
       * left intact so a temporary backend problem cannot log the user out.
       */
      restoreSession: async ({ force = false } = {}) => {
        const current = get().sessionStatus;

        if (current === 'checking') return current;

        if (
          !force &&
          (current === 'authenticated' || current === 'unauthenticated')
        ) {
          return current;
        }

        set({ sessionStatus: 'checking' });

        try {
          const user = await authService.me();

          set({
            user,
            isAuthenticated: true,
            sessionStatus: 'authenticated',
            error: null,
          });

          return 'authenticated';
        } catch (error) {
          if (error?.status === 401) {
            set({
              user: null,
              isAuthenticated: false,
              sessionStatus: 'unauthenticated',
            });

            return 'unauthenticated';
          }

          set({ sessionStatus: 'error' });

          return 'error';
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch {
          // Clear the local session even when the server call fails.
        }

        set({
          user: null,
          isAuthenticated: false,
          sessionStatus: 'unauthenticated',
          error: null,
        });
      },

      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      isAdmin: () => isAdminUser(get().user),

      hasPermission: (permission) => {
        const { user } = get();

        if (!isAdminUser(user)) return false;
        if (user.role === 'master_admin') return true;

        return user.permissions?.includes(permission) ?? false;
      },

      canAdmin: (permission) => get().hasPermission(permission),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
