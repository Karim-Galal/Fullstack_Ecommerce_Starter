'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { applyTheme } from '@/lib/theme';
import { useThemeStore } from '@/stores/themeStore';

export function ThemeProvider({ children }) {
  const pathname = usePathname();
  const theme = useThemeStore((state) => state.theme);
  const palette = useThemeStore((state) => state.palette);

  useEffect(() => {
    applyTheme(theme, palette);
  }, [pathname, theme, palette]);

  return children;
}