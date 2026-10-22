'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icons';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { storeConfig } from '@/config/store';

const navigationItems = [
  { key: 'home', path: '/', anchor: null },
  { key: 'newArrivals', path: '/', anchor: 'new-arrivals' },
  { key: 'ourCraft', path: '/', anchor: 'craft' },
  { key: 'shop', path: '/products', anchor: null },
  { key: 'collections', path: '/collections', anchor: null },
];

const subscribeToClient = () => () => {};

export function MobileNavigation({ isOpen, onClose }) {
  const mounted = useSyncExternalStore(
    subscribeToClient,
    () => true,
    () => false,
  );
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('navigation');
  const isArabic = locale === 'ar';

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

  const isActive = (item) => {
    if (item.anchor) return false;
    if (item.path === '/') return normalizedPath === '/';

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

  if (!mounted) return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label={t('closeMenu')}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onClick={onClose}
        className={`fixed inset-0 z-[1000] bg-black/45 backdrop-blur-[2px] transition-opacity duration-200 md:hidden ${
          isOpen
            ? 'visible opacity-100'
            : 'invisible pointer-events-none opacity-0'
        }`}
      />

      <nav
        id="mobile-navigation"
        aria-label={t('mainNavigation')}
        aria-hidden={!isOpen}
        aria-modal="true"
        role="dialog"
        className={`fixed inset-y-0 z-[1001] flex w-[min(86vw,340px)] flex-col overflow-y-auto bg-surface p-5 shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isArabic ? 'right-0 border-l border-border' : 'left-0 border-r border-border'
        } ${
          isOpen
            ? 'translate-x-0'
            : isArabic
              ? 'translate-x-full'
              : '-translate-x-full'
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-text-primary">
            {storeConfig.name}
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label={t('closeMenu')}
            tabIndex={isOpen ? 0 : -1}
            className="flex size-10 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-surface-hover"
          >
            <Icon name="close" size="lg" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {navigationItems.map((item) => {
            const active = isActive(item);

            return (
              <Link
                key={item.key}
                href={buildHref(item)}
                aria-current={active ? 'page' : undefined}
                tabIndex={isOpen ? 0 : -1}
                onClick={onClose}
                className={`flex min-h-12 items-center rounded-lg px-4 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-surface-hover text-text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto border-t border-border pt-6">
          <ThemeToggle showLabel />

          <Link
            href={`/${locale}/login`}
            tabIndex={isOpen ? 0 : -1}
            onClick={onClose}
            className="flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Icon name="user" size="sm" />
            {t('login')}
          </Link>

          <Link
            href={`/${locale}/register`}
            tabIndex={isOpen ? 0 : -1}
            onClick={onClose}
            className="mt-1 flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Icon name="register" size="sm" />
            {t('register')}
          </Link>
        </div>
      </nav>
    </>,
    document.body
  );
}

export default MobileNavigation;
