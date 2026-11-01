'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Icon } from '@/components/icons';

// Add an item only after its localized admin page exists. Backend policies
// remain authoritative; permissions here only hide links the user cannot use.
const adminNavItems = [
  {
    href: '/admin',
    label: 'dashboard',
    icon: 'grid',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/products',
    label: 'products',
    icon: 'products',
    permission: 'products.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/categories',
    label: 'categories',
    icon: 'list',
    permission: 'categories.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/collections',
    label: 'collections',
    icon: 'layers',
    permission: 'collections.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/orders',
    label: 'orders',
    icon: 'orders',
    permission: 'orders.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/payments',
    label: 'payments',
    icon: 'payment',
    permission: 'payments.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/invoices',
    label: 'invoices',
    icon: 'documents',
    permission: 'invoices.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/coupons',
    label: 'coupons',
    icon: 'discount',
    permission: 'coupons.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/offers',
    label: 'offers',
    icon: 'offer',
    permission: 'offers.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/reviews',
    label: 'reviews',
    icon: 'star',
    permission: 'reviews.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/shipping-methods',
    label: 'shippingMethods',
    icon: 'shipping',
    permission: 'shipping_methods.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/users',
    label: 'users',
    icon: 'users',
    permission: 'users.view',
    roles: ['master_admin', 'staff'],
  },
  {
    href: '/admin/invitations',
    label: 'invitations',
    icon: 'email',
    roles: ['master_admin'],
  },
  {
    href: '/admin/trash',
    label: 'trash',
    icon: 'delete',
    roles: ['master_admin', 'staff'],
  },
];

function stripLocale(pathname, locale) {
  const localePrefix = `/${locale}`;

  if (pathname === localePrefix) return '/';
  if (pathname.startsWith(`${localePrefix}/`)) {
    return pathname.slice(localePrefix.length);
  }

  return pathname;
}

function withLocale(locale, href) {
  return `/${locale}${href === '/' ? '' : href}`;
}

const MOBILE_MEDIA_QUERY = '(max-width: 47.999rem)';

function subscribeToMobileQuery(callback) {
  const mediaQuery = window.matchMedia(MOBILE_MEDIA_QUERY);
  mediaQuery.addEventListener('change', callback);

  return () => mediaQuery.removeEventListener('change', callback);
}

function getMobileSnapshot() {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function getMobileServerSnapshot() {
  return false;
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeToMobileQuery,
    getMobileSnapshot,
    getMobileServerSnapshot
  );
}

export function AdminSidebar({ mobileOpen, onMobileClose, isMobile }) {
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations('navigation');
  const tAdmin = useTranslations('admin');
  const { user, hasPermission } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);

  const isRtl = locale === 'ar';
  const normalizedPath = stripLocale(pathname, locale);

  const isActive = (href) =>
    normalizedPath === href ||
    (href !== '/admin' && normalizedPath.startsWith(`${href}/`));

  const filteredItems = adminNavItems.filter((item) => {
    if (!item.roles.includes(user?.role)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  useEffect(() => {
    if (isMobile && mobileOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isMobile, mobileOpen]);

  const trapFocus = (event) => {
    if (!isMobile || !mobileOpen || event.key !== 'Tab') return;

    const focusableElements = Array.from(
      sidebarRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ) || []
    ).filter((element) => element.getClientRects().length > 0);

    if (focusableElements.length === 0) {
      event.preventDefault();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          onClick={onMobileClose}
          aria-label={tNav('closeMenu')}
          className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/45 backdrop-blur-[2px] md:hidden"
        />
      )}

      <aside
        ref={sidebarRef}
        id="admin-sidebar"
        onKeyDown={trapFocus}
        role={isMobile ? 'dialog' : undefined}
        aria-modal={isMobile && mobileOpen ? 'true' : undefined}
        aria-hidden={isMobile && !mobileOpen ? true : undefined}
        inert={isMobile && !mobileOpen ? true : undefined}
        aria-label={tNav('mainNavigation')}
        className={`fixed inset-y-0 start-0 z-[var(--z-modal)] flex w-64 max-w-[85vw] flex-col border-e border-border bg-surface shadow-2xl transition-transform duration-300 ease-in-out md:static md:z-auto md:translate-x-0 md:shadow-none ${
          mobileOpen
            ? 'translate-x-0'
            : isRtl
              ? 'translate-x-full'
              : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <span
            className={`font-bold text-xl text-text-primary ${
              collapsed ? 'md:hidden' : ''
            }`}
          >
            {tAdmin('adminPanel')}
          </span>

          <div className="flex items-center gap-1">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onMobileClose}
              aria-label={tNav('closeMenu')}
              className="flex size-10 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-hover hover:text-primary md:hidden"
            >
              <Icon name="close" size="md" />
            </button>

            <button
              type="button"
              onClick={() => setCollapsed((current) => !current)}
              className="hidden rounded-lg p-2 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-primary md:inline-flex"
              aria-label={
                collapsed
                  ? tAdmin('expandSidebar')
                  : tAdmin('collapseSidebar')
              }
            >
              <Icon
                name={
                  collapsed
                    ? isRtl
                      ? 'chevronLeft'
                      : 'chevronRight'
                    : isRtl
                      ? 'chevronRight'
                      : 'chevronLeft'
                }
                size="md"
              />
            </button>
          </div>
        </div>

        <nav
          className="flex-1 space-y-1 overflow-y-auto p-4"
          aria-label={tNav('mainNavigation')}
        >
          {filteredItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={withLocale(locale, item.href)}
                onClick={onMobileClose}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon
                  name={item.icon}
                  size="md"
                  className="flex-shrink-0"
                  aria-hidden="true"
                />
                {!collapsed && (
                  <span className="truncate">{tAdmin(item.label)}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
              <span className="text-sm font-medium text-primary">AD</span>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary">
                  {user?.name || '—'}
                </p>
                <p className="truncate text-xs text-text-tertiary">
                  {user?.role === 'master_admin'
                    ? tAdmin('roleMasterAdmin')
                    : tAdmin('roleStaff')}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export function AdminHeader({
  mobileNavOpen,
  mobileToggleRef,
  onOpenMobileNav,
}) {
  const pathname = usePathname();
  const locale = useLocale();
  const tNav = useTranslations('navigation');
  const tAdmin = useTranslations('admin');
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const normalizedPath = stripLocale(pathname, locale);
  const breadcrumbLabels = {
    admin: 'adminPanel',
    products: 'products',
    categories: 'categories',
    collections: 'collections',
    orders: 'orders',
    payments: 'payments',
    invoices: 'invoices',
    coupons: 'coupons',
    offers: 'offers',
    reviews: 'reviews',
    users: 'users',
    invitations: 'invitations',
    'shipping-methods': 'shippingMethods',
    trash: 'trash',
    new: 'create',
    edit: 'edit',
  };
  const detailSegments = { detail: 'view' };

  const breadcrumbs = normalizedPath
    .split('/')
    .filter(Boolean)
    .map((segment, index, segments) => {
      const isLast = index === segments.length - 1;
      const translationKey =
        breadcrumbLabels[segment] || detailSegments[segment];

      return {
        key: segments.slice(0, index + 1).join('/'),
        label: translationKey
          ? tAdmin(translationKey)
          : segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        isLast,
      };
    });

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore
    }
  };

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] h-16 border-b border-border bg-surface/95 backdrop-blur-sm">
      <div className="shell flex h-full items-center justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <button
            ref={mobileToggleRef}
            type="button"
            onClick={onOpenMobileNav}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface-hover hover:text-primary md:hidden"
            aria-label={tNav('openMenu')}
            aria-expanded={mobileNavOpen}
            aria-controls="admin-sidebar"
          >
            <Icon name="menu" size="md" />
          </button>

          <nav
            className="min-w-0 overflow-hidden"
            aria-label={tAdmin('breadcrumb')}
          >
            <ol className="flex items-center gap-2">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.key} className="flex items-center gap-2">
                  {index > 0 && (
                    <Icon
                      name="chevronRight"
                      size="xs"
                      className="text-text-tertiary rtl:rotate-180"
                      aria-hidden="true"
                    />
                  )}
                  {crumb.isLast ? (
                    <span className="truncate font-medium text-text-primary">
                      {crumb.label}
                    </span>
                  ) : (
                    <span className="truncate text-sm text-text-secondary">
                      {crumb.label}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={withLocale(locale, '/')}
            className="hidden rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary sm:block"
            target="_blank"
            rel="noopener noreferrer"
          >
            {tNav('shop')}
          </Link>

          <div className="relative">
            <button
              type="button"
              onClick={() => setUserMenuOpen((current) => !current)}
              className="flex items-center gap-2 rounded-lg p-2 text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label={tNav('account')}
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <Icon
                name="chevronDown"
                size="sm"
                className="text-text-tertiary"
              />
            </button>

            {userMenuOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
                aria-hidden="true"
              />
            )}

            {userMenuOpen && (
              <div className="absolute end-0 z-50 mt-2 w-56 rounded-lg border border-border bg-surface py-2 shadow-xl animate-slide-in">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate font-medium text-text-primary">
                    {user?.name}
                  </p>
                  <p className="truncate text-sm text-text-tertiary">
                    {user?.email}
                  </p>
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {user?.role === 'master_admin' && tAdmin('roleMasterAdmin')}
                    {user?.role === 'staff' && tAdmin('roleStaff')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-start text-sm text-error hover:bg-surface-hover"
                >
                  {tNav('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export function AdminLayout({ children }) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileToggleRef = useRef(null);

  const closeMobileNav = useCallback(() => {
    setMobileOpen(false);

    if (isMobile) {
      window.requestAnimationFrame(() => mobileToggleRef.current?.focus());
    }
  }, [isMobile]);

  useEffect(() => {
    const desktopQuery = window.matchMedia('(min-width: 48rem)');
    const closeOnDesktop = (event) => {
      if (event.matches) {
        setMobileOpen(false);
      }
    };

    desktopQuery.addEventListener('change', closeOnDesktop);

    return () => desktopQuery.removeEventListener('change', closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeMobileNav();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mobileOpen, closeMobileNav]);

  return (
    <div className="flex min-h-screen bg-surface-sunken">
      <AdminSidebar
        mobileOpen={mobileOpen}
        onMobileClose={closeMobileNav}
        isMobile={isMobile}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader
          mobileNavOpen={mobileOpen}
          mobileToggleRef={mobileToggleRef}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
