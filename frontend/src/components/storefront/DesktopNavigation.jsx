'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { key: 'home', path: '/', anchor: null },
  { key: 'newArrivals', path: '/', anchor: 'new-arrivals' },
  { key: 'ourCraft', path: '/', anchor: 'craft' },
  { key: 'shop', path: '/products', anchor: null },
  { key: 'collections', path: '/collections', anchor: null },
];

export function DesktopNavigation() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('navigation');

  const normalizedPath =
    pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';
  const isArabic = locale === 'ar';

  const isActive = (item) => {
    if (item.anchor) return false;

    if (item.path === '/') {
      return normalizedPath === '/';
    }

    return (
      normalizedPath === item.path ||
      normalizedPath.startsWith(`${item.path}/`)
    );
  };

  const buildHref = (item) => {
    const path = item.path === '/' ? '' : item.path;
    const anchor = item.anchor ? `#${item.anchor}` : '';

    return `/${locale}${path}${anchor}`;
  };

  return (
    <nav
      aria-label={t('mainNavigation')}
      className="hidden items-center gap-7 md:flex lg:gap-9"
    >
      {navigationItems.map((item) => {
        const active = isActive(item);

        return (
          <Link
            key={item.key}
            href={buildHref(item)}
            aria-current={active ? 'page' : undefined}
            className={`group relative py-2 transition-colors duration-200 ${
              isArabic
                ? 'text-sm font-medium'
                : 'text-[0.72rem] font-semibold uppercase tracking-[0.18em]'
            } ${
              active
                ? 'text-text-primary'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {t(item.key)}

            <span
              aria-hidden="true"
              className={`absolute inset-x-0 bottom-0 h-px origin-center bg-text-primary transition-transform duration-300 ease-out ${
                active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export default DesktopNavigation;
