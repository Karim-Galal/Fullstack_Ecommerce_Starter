'use client';

import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { Icon } from '@/components/icons';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { useAuthStore } from '@/stores/authStore';
import { storeConfig } from '@/config/store';

const navigationItems = [
  { key: 'home', path: '/' },
  { key: 'products', path: '/products' },
  { key: 'collections', path: '/collections' },
  { key: 'wishlist', path: '/wishlist' },
];

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

const DRAWER_DURATION = 360;
const OVERLAY_DURATION = 280;
const EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

export default function MobileNavigation({ isOpen, onClose }) {
  const t = useTranslations('navigation');
  const locale = useLocale();
  const pathname = usePathname();
  const { isAuthenticated } = useAuthStore();
  const isArabic = locale === 'ar';
  const isMounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const drawerRef = useRef(null);
  const overlayRef = useRef(null);
  const animationsRef = useRef([]);
  const onCloseRef = useRef(onClose);

  const closeMenu = useCallback(() => {
    onCloseRef.current();
  }, []);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isMounted) return;

    const drawer = drawerRef.current;
    const overlay = overlayRef.current;

    if (!drawer || !overlay) return;

    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];

    const drawerDuration = DRAWER_DURATION;
    const overlayDuration = OVERLAY_DURATION;

    const closedTransform = isArabic
      ? 'translateX(100%)'
      : 'translateX(-100%)';

    const drawerAnimation = drawer.animate(
      [
        {
          transform: isOpen ? closedTransform : 'translateX(0)',
        },
        {
          transform: isOpen ? 'translateX(0)' : closedTransform,
        },
      ],
      {
        duration: drawerDuration,
        easing: EASING,
        fill: 'forwards',
      },
    );

    const overlayAnimation = overlay.animate(
      [
        { opacity: isOpen ? 0 : 1 },
        { opacity: isOpen ? 1 : 0 },
      ],
      {
        duration: overlayDuration,
        easing: 'ease',
        fill: 'forwards',
      },
    );

    animationsRef.current = [drawerAnimation, overlayAnimation];

    return () => {
      animationsRef.current.forEach((animation) => animation.cancel());
      animationsRef.current = [];
    };
  }, [isOpen, isArabic, isMounted]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeMenu]);

  if (!isMounted) return null;

  const normalizedPath =
    pathname.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/';

  const isActive = (item) => {
    if (item.path === '/') return normalizedPath === '/';

    return (
      normalizedPath === item.path ||
      normalizedPath.startsWith(`${item.path}/`)
    );
  };

  const buildHref = (item) =>
    `/${locale}${item.path === '/' ? '' : item.path}`;

  return createPortal(
    <>
      <button
        ref={overlayRef}
        type="button"
        aria-label={t('closeMenu')}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onClick={closeMenu}
        className={[
          'fixed inset-0 z-1000 bg-black/45 backdrop-blur-[2px]',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none',
        ].join(' ')}
        style={{ opacity: 0 }}
      />

      <nav
        ref={drawerRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal={isOpen ? 'true' : undefined}
        aria-hidden={!isOpen}
        aria-label={t('mainNavigation')}
        inert={!isOpen}
        dir={isArabic ? 'rtl' : 'ltr'}
        className={[
          'fixed inset-y-0 z-1001 flex w-[min(20rem,85vw)] flex-col',
          'bg-surface text-text-primary shadow-2xl',
          isArabic ? 'right-0' : 'left-0',
          isOpen ? 'pointer-events-auto' : 'pointer-events-none',
        ].join(' ')}
        style={{
          transform: isArabic ? 'translateX(100%)' : 'translateX(-100%)',
          visibility: 'visible',
        }}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Link
            href={`/${locale}`}
            onClick={closeMenu}
            className="text-lg font-semibold tracking-wide text-text-primary"
          >
            {storeConfig.name}
          </Link>

          <button
            type="button"
            onClick={closeMenu}
            aria-label={t('closeMenu')}
            className="flex size-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Icon name="close" size="lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <div className="flex flex-col gap-1">
            {navigationItems.map((item) => {
              const active = isActive(item);

              return (
                <Link
                  key={item.key}
                  href={buildHref(item)}
                  onClick={closeMenu}
                  aria-current={active ? 'page' : undefined}
                  className={[
                    'rounded-lg px-4 py-3 text-sm font-medium',
                    'transition-colors duration-200',
                    active
                      ? 'bg-surface-hover text-text-primary'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary',
                  ].join(' ')}
                >
                  {t(item.key)}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="border-t border-border p-4">
          <ThemeToggle showLabel  />

          {!isAuthenticated && (
            // <div className="flex flex-col gap-2 pt-2">
            <div className="flex flex-col pt-2">
              <Link
                href={`/${locale}/login`}
                onClick={closeMenu}
                className="flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <Icon name="login" size="md" />
                {t('login')}
              </Link>

              <Link
                href={`/${locale}/register`}
                onClick={closeMenu}
                className="flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <Icon name="register" size="md" />
                {t('register')}
              </Link>
            </div>
          )}
        </div>
      </nav>
    </>,
    document.body,
  );
}