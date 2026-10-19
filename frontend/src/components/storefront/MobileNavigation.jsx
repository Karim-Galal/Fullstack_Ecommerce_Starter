'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icons';

const navigationItems = [
  { key: 'home', href: '/' },
  { key: 'shop', href: '/products' },
  { key: 'categories', href: '/categories' },
  { key: 'collections', href: '/collections' },
];

export function MobileNavigation({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const isArabic = locale === 'ar';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const normalizedPath =
    pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';

  const isActive = (href) => {
    if (href === '/') return normalizedPath === '/';

    return (
      normalizedPath === href ||
      normalizedPath.startsWith(`${href}/`)
    );
  };

  if (!mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label={t('closeMenu')}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-[1000] bg-black/50 transition-opacity duration-200 md:hidden ${
          isOpen
            ? 'visible opacity-100'
            : 'invisible pointer-events-none opacity-0'
        }`}
      />

      <nav
        id="mobile-navigation"
        aria-label={t('shop')}
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 z-[1001] flex w-[min(85vw,320px)] flex-col overflow-y-auto bg-surface p-5 shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isArabic ? 'right-0 border-l border-border' : 'left-0 border-r border-border'
        } ${
          isOpen
            ? 'translate-x-0'
            : isArabic
              ? 'translate-x-full'
              : '-translate-x-full'
        }`}
      >
        <div className="mb-6 flex items-center justify-between">
          <span className="text-lg font-semibold text-text-primary">
            {t('shop')}
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeMenu')}
            tabIndex={isOpen ? 0 : -1}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-text-primary hover:bg-surface-hover"
          >
            <Icon name="close" size="lg" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const active = isActive(item.href);
            const href = `/${locale}${item.href === '/' ? '' : item.href}`;

            return (
              <Link
                key={item.key}
                href={href}
                aria-current={active ? 'page' : undefined}
                tabIndex={isOpen ? 0 : -1}
                onClick={onClose}
                className={`flex items-center rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-surface-hover text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </div>
      </nav>
    </>,
    document.body
  );
}

export default MobileNavigation;