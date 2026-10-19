'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('navigation');

  if (!user) return null;

  const menuItems = [
    { href: '/account', key: 'profile' },
    { href: '/orders', key: 'orders' },
    { href: '/addresses', key: 'addresses' },
    { href: '/wishlist', key: 'wishlist' },
    ...(user.role && user.role !== 'customer'
      ? [{ href: '/admin', key: 'admin' }]
      : []),
  ];

  return (
    <div className="relative">
      <button
        type="button"
        className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-primary"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('account')}
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
          {user.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
        </span>

        <span className="hidden max-w-28 truncate text-sm sm:block">
          {user.name}
        </span>

        <Icon name="chevronDown" size="sm" />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label={t('closeMenu')}
            onClick={() => setOpen(false)}
          />

          <div className="absolute end-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
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
                  href={href}
                  className="flex min-h-10 items-center rounded-lg px-3 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
                  onClick={() => setOpen(false)}
                >
                  {t(key)}
                </Link>
              ))}

              <div className="my-2 border-t border-border" />

              <button
                type="button"
                className="flex min-h-10 w-full items-center rounded-lg px-3 text-start text-sm text-error transition-colors hover:bg-surface-hover"
                onClick={async () => {
                  setOpen(false);
                  await onLogout?.();
                }}
              >
                {t('logout')}
              </button>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}