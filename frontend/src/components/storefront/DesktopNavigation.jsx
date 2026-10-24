'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { key: 'home', path: '/' },
  { key: 'products', path: '/products' },
  { key: 'collections', path: '/collections' },
];

export default function DesktopNavigation() {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();

  const normalizedPath =
    pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';

  const isArabic = locale === 'ar';

  const isActive = (path) => {
    if (path === '/') {
      return normalizedPath === '/';
    }

    return (
      normalizedPath === path ||
      normalizedPath.startsWith(`${path}/`)
    );
  };

  return (
    <nav
      aria-label={t('mainNavigation')}
      // className="hidden items-center gap-1 rounded-full border border-border/60 bg-surface/60 p-1 backdrop-blur-md md:flex"
      className="hidden items-center gap-1 md:flex"
    >
      {navigationItems.map((item) => {
        const active = isActive(item.path);

        return (
          <Link
            key={item.key}
            href={`/${locale}${item.path === '/' ? '' : item.path}`}
            aria-current={active ? 'page' : undefined}
            className={[
              'relative isolate rounded-full px-4 py-2',
              'transition-colors duration-200 ease-out',
              'focus-visible:outline-2 focus-visible:outline-offset-2',
              'focus-visible:outline-primary',
              'motion-reduce:transition-none',
              isArabic
                ? 'text-sm font-medium'
                : 'text-xs font-semibold uppercase tracking-wider',
              active
                ? 'bg-surface-hover text-text-primary'
                : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
            ].join(' ')}
          >
            <span className="relative z-10">{t(item.key)}</span>
          </Link>
        );
      })}
    </nav>
  );
}