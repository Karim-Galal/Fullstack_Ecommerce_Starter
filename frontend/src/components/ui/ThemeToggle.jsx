'use client';

import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';
import { useThemeStore } from '@/stores/themeStore';

const iconButtonClass =
  'relative flex size-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export function ThemeToggle({ showLabel = false, className = '' }) {
  const t = useTranslations('navigation');
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t('themeLight') : t('themeDark')}
      title={t('themeToggle')}
      className={
        showLabel
          ? `flex min-h-11 w-full items-center gap-3 rounded-lg px-4 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary ${className}`
          : `${iconButtonClass} ${className}`
      }
    >
      <Icon name={isDark ? 'sun' : 'moon'} size="md" />
      {showLabel && <span>{isDark ? t('themeLight') : t('themeDark')}</span>}
    </button>
  );
}

export default ThemeToggle;
