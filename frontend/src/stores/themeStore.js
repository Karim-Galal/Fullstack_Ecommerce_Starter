import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { applyTheme, getInitialTheme, isValidTheme } from '@/lib/theme';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'light',
      isLoading: false,

      setTheme: (theme) => {
        if (!isValidTheme(theme)) return;
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        set({ theme: newTheme });
      },

      initTheme: () => {
        const theme = getInitialTheme();
        applyTheme(theme);
        set({ theme });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);