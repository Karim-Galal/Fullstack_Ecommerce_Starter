'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const t = useTranslations('navigation');
  const locale = useLocale();

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const menuItems = [
    { href: '/account', key: 'profile' },
    { href: '/orders', key: 'orders' },
    { href: '/addresses', key: 'addresses' },
    { href: '/wishlist', key: 'wishlist' },
    ...(user?.role && user.role !== 'customer'
      ? [{ href: '/admin', key: 'admin' }]
      : []),
  ];

  const accountHref = (href) => `/${locale}${href}`;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        className="flex size-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('account')}
      >
        {user ? (
          <span className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-sm font-semibold text-text-primary">
            {user.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
          </span>
        ) : (
          <Icon name="user" size="md" />
        )}
      </button>

      {open && (
        <div
          className="absolute end-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-lg"
          role="menu"
        >
          {user ? (
            <>
              <div className="border-b border-border px-4 py-3">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {user.name}
                </p>
                <p className="mt-1 truncate text-xs text-text-secondary">
                  {user.email}
                </p>
              </div>

              <nav className="p-2" aria-label={t('account')}>
                {menuItems.map(({ href, key }) => (
                  <Link
                    key={key}
                    href={accountHref(href)}
                    role="menuitem"
                    className="flex min-h-10 items-center rounded-lg px-3 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
                    onClick={() => setOpen(false)}
                  >
                    {t(key)}
                  </Link>
                ))}

                <div className="my-2 border-t border-border" />

                <button
                  type="button"
                  role="menuitem"
                  className="flex min-h-10 w-full items-center rounded-lg px-3 text-start text-sm text-error transition-colors hover:bg-surface-hover"
                  onClick={async () => {
                    setOpen(false);
                    await onLogout?.();
                  }}
                >
                  {t('logout')}
                </button>
              </nav>
            </>
          ) : (
            <nav className="p-2" aria-label={t('account')}>
              <Link
                href={accountHref('/login')}
                role="menuitem"
                className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
                onClick={() => setOpen(false)}
              >
                <Icon name="user" size="sm" />
                {t('login')}
              </Link>

              <Link
                href={accountHref('/register')}
                role="menuitem"
                className="flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
                onClick={() => setOpen(false)}
              >
                <Icon name="user" size="sm" />
                {t('register')}
              </Link>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}