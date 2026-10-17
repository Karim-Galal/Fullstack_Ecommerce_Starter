'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { Icon, IconButton } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useState, useEffect } from 'react';

const adminNavItems = [
  { href: '/admin', label: 'dashboard', icon: 'home', roles: ['master_admin', 'staff'] },
  { href: '/admin/products', label: 'products', icon: 'products', roles: ['master_admin', 'staff'], permission: 'products.view' },
  { href: '/admin/categories', label: 'categories', icon: 'layers', roles: ['master_admin', 'staff'], permission: 'categories.view' },
  { href: '/admin/collections', label: 'collections', icon: 'layers', roles: ['master_admin', 'staff'], permission: 'collections.view' },
  { href: '/admin/orders', label: 'orders', icon: 'orders', roles: ['master_admin', 'staff'] },
  { href: '/admin/coupons', label: 'coupons', icon: 'tag', roles: ['master_admin', 'staff'], permission: 'coupons.view' },
  { href: '/admin/offers', label: 'offers', icon: 'offer', roles: ['master_admin', 'staff'], permission: 'offers.view' },
  { href: '/admin/reviews', label: 'reviews', icon: 'star', roles: ['master_admin', 'staff'] },
  { href: '/admin/users', label: 'users', icon: 'users', roles: ['master_admin'] },
  { href: '/admin/invitations', label: 'invitations', icon: 'mail', roles: ['master_admin'] },
  { href: '/admin/shipping-methods', label: 'shippingMethods', icon: 'shipping', roles: ['master_admin', 'staff'] },
  { href: '/admin/settings', label: 'settings', icon: 'settings', roles: ['master_admin'] },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const tNav = useTranslations('navigation');
  const tAdmin = useTranslations('admin');
  const { user, hasPermission } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href) => pathname === href || (href !== '/admin' && pathname.startsWith(href));

  const filteredItems = adminNavItems.filter((item) => {
    if (!item.roles.includes(user?.role)) return false;
    if (item.permission && !hasPermission(item.permission)) return false;
    return true;
  });

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-surface border border-border shadow-lg"
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar"
        aria-label="Toggle sidebar"
      >
        {mobileOpen ? <Icon name="close" size="md" /> : <Icon name="menu" size="md" />}
      </button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />
      )}

      <aside
        id="admin-sidebar"
        className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-border transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto flex flex-col`}
        aria-label="Admin navigation"
      >
        <div className="flex h-16 items-center justify-between px-4 border-b border-border">
          {!collapsed && (
            <Link href="/admin" className="font-bold text-xl text-text-primary" aria-label="Admin Dashboard">
              Admin Panel
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-lg text-text-tertiary hover:text-primary hover:bg-surface-hover transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
          >
            <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size="md" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Admin navigation">
          {filteredItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon name={item.icon} size="md" className="flex-shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{tAdmin[item.label] || tNav[item.label]}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-medium text-primary">AD</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">Admin User</p>
                <p className="text-xs text-text-tertiary truncate">master_admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

export function AdminHeader() {
  const pathname = usePathname();
  const tNav = useTranslations('navigation');
  const { user, logout } = useAuthStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore
    }
  };

  const breadcrumbs = pathname
    .split('/')
    .filter(Boolean)
    .map((segment, index, arr) => {
      const href = '/' + arr.slice(0, index + 1).join('/');
      const isLast = index === arr.length - 1;
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      return { href, label, isLast };
    });

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] h-16 bg-surface/95 backdrop-blur-sm border-b border-border">
      <div className="shell flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-hover"
            onClick={() => document.getElementById('admin-sidebar')?.classList.remove('-translate-x-full')}
            aria-label="Toggle sidebar"
          >
            <Icon name="menu" size="md" />
          </button>

          <nav className="flex items-center gap-2" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-2">
                {index > 0 && <Icon name="chevronRight" size="xs" className="text-text-tertiary" />}
                {crumb.isLast ? (
                  <span className="font-medium text-text-primary">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-sm text-text-secondary hover:text-primary">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:block px-3 py-1.5 text-sm text-text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            View Store
          </Link>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium text-primary">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <Icon name="chevronDown" size="sm" className="text-text-tertiary" />
            </button>

            {userMenuOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
            )}

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-surface rounded-lg shadow-xl border border-border py-2 z-50 animate-slide-in">
                <div className="px-4 py-3 border-b border-border">
                  <p className="font-medium text-text-primary truncate">{user?.name}</p>
                  <p className="text-sm text-text-tertiary truncate">{user?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                    {user?.role === 'master_admin' && 'Master Admin'}
                    {user?.role === 'staff' && 'Staff'}
                  </span>
                </div>
                <Link
                  href="/admin/profile"
                  className="block px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-surface-hover"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Profile
                </Link>
                <hr className="my-2 border-border" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-hover"
                >
                  Logout
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
  return (
    <div className="flex min-h-screen bg-surface-sunken">
      <AdminSidebar />
      <div className="flex-1 flex flex-col md:pl-0">
        <AdminHeader />
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}