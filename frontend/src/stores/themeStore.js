import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  applyTheme,
  defaultMode,
  defaultPalette,
  isValidMode,
  isValidPalette,
} from '@/lib/theme';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: defaultMode,
      palette: defaultPalette,
      isLoading: false,

      setTheme: (theme) => {
        if (!isValidMode(theme)) return;
        const { palette } = get();
        applyTheme(theme, palette);
        set({ theme });
      },

      toggleTheme: () => {
        const { theme, palette } = get();
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme, palette);
        set({ theme: nextTheme });
      },

      setPalette: (palette) => {
        if (!isValidPalette(palette)) return;
        const { theme } = get();
        applyTheme(theme, palette);
        set({ palette });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ theme: state.theme, palette: state.palette }),
      migrate: (persistedState) => ({
        theme: isValidMode(persistedState?.theme) ? persistedState.theme : defaultMode,
        palette: isValidPalette(persistedState?.palette) ? persistedState.palette : defaultPalette,
      }),
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme, state.palette);
      },
    }
  )
);
