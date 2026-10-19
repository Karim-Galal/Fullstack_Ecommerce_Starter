'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';

const navigationItems = [
  { key: 'home', href: '/' },
  { key: 'shop', href: '/products' },
  { key: 'categories', href: '/categories' },
  { key: 'collections', href: '/collections' },
];

export function DesktopNavigation() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('navigation');

  const normalizedPath =
    pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';

  const isActive = (href) => {
    if (href === '/') {
      return normalizedPath === '/';
    }

    return (
      normalizedPath === href ||
      normalizedPath.startsWith(`${href}/`)
    );
  };

  return (
    <nav
      aria-label={t('home')}
      className="hidden items-center gap-6 md:flex"
    >
      {navigationItems.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.key}
            href={`/${locale}${item.href === '/' ? '' : item.href}`}
            aria-current={active ? 'page' : undefined}
            className={`group relative py-2 text-sm font-medium transition-colors duration-200 ${
              active
                ? 'text-primary'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            {t(item.key)}

            <span
              aria-hidden="true"
              className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-center rounded-full bg-primary transition-transform duration-200 ease-out ${
                active
                  ? 'scale-x-100'
                  : 'scale-x-0 group-hover:scale-x-100'
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}

export default DesktopNavigation;