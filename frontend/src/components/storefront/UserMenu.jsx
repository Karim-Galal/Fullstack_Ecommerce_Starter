'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';
import { DropdownMenu } from '@/components/ui/overlays/DropdownMenu';

export default function UserMenu({ user, onLogout }) {
  const t = useTranslations('navigation');
  const locale = useLocale();

  const accountHref = (href) => `/${locale}${href}`;

  const menuItems = user
    ? [
        {
          type: 'label',
          key: 'account-name',
          label: user.name,
        },
        { type: 'divider', key: 'account-divider' },
        {
          key: 'profile',
          label: t('profile'),
          icon: 'user',
          href: accountHref('/account'),
        },
        {
          key: 'orders',
          label: t('orders'),
          icon: 'orders',
          href: accountHref('/orders'),
        },
        {
          key: 'addresses',
          label: t('addresses'),
          icon: 'shipping',
          href: accountHref('/addresses'),
        },
        {
          key: 'wishlist',
          label: t('wishlist'),
          icon: 'wishlist',
          href: accountHref('/wishlist'),
        },
        ...(user.role && user.role !== 'customer'
          ? [
              {
                key: 'admin',
                label: t('admin'),
                icon: 'admin',
                href: accountHref('/admin'),
              },
            ]
          : []),
        { type: 'divider', key: 'logout-divider' },
        {
          key: 'logout',
          label: t('logout'),
          icon: 'logout',
          danger: true,
          onClick: () => onLogout?.(),
        },
      ]
    : [
        {
          key: 'login',
          label: t('login'),
          icon: 'login',
          href: accountHref('/login'),
        },
        {
          key: 'register',
          label: t('register'),
          icon: 'register',
          href: accountHref('/register'),
        },
      ];

  return (
    <DropdownMenu
      label={t('account')}
      align="end"
      items={menuItems}
      trigger={
        <span className="flex size-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary">
          {user ? (
            <span className="flex size-8 items-center justify-center rounded-full bg-surface-sunken text-sm font-semibold text-text-primary">
              {user.name?.trim()?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          ) : (
            <Icon name="user" size="md" />
          )}
          <span className="sr-only">{t('account')}</span>
        </span>
      }
    />
  );
}
