'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useThemeStore } from '@/stores/themeStore';

export function ThemeProvider({ children }) {
  const pathname = usePathname();
  const initTheme = useThemeStore((state) => state.initTheme);

  useEffect(() => {
    initTheme();
  }, [pathname, initTheme]);

  return <>{children}</>;
}