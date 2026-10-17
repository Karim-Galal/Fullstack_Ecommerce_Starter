
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { defaultLocale, isValidLocale } from '@/lib/locale';

export const useLocaleStore = create(
  persist(
    (set, get) => ({
      locale: defaultLocale,
      isLoading: false,

      setLocale: (locale) => {
        if (!isValidLocale(locale)) return;
        set({ locale });
      },

      toggleLocale: () => {
        const { locale } = get();
        set({ locale: locale === 'en' ? 'ar' : 'en' });
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'locale-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ locale: state.locale }),
    },
  ),
);
