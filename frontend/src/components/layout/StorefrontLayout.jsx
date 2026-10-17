'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Icon, IconButton } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useState, useEffect } from 'react';

export function StorefrontHeader() {
  const pathname = usePathname();
  const tNav = useTranslations('navigation');
  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount, isLoading: cartLoading } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartPreviewOpen, setCartPreviewOpen] = useState(false);

  const isActive = (href) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const navItems = [
    { href: '/', label: tNav.home, exact: true },
    { href: '/products', label: tNav.products },
    { href: '/categories', label: tNav.categories },
    { href: '/collections', label: tNav.collections },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // Ignore errors
    }
  };

  return (
    <header className="sticky top-0 z-(--z-sticky) bg-surface/95 backdrop-blur-sm border-b border-border">
      <nav className="shell flex h-16 items-center justify-between" aria-label="Main navigation">
        <Link href="/" className="font-bold text-xl text-text-primary" aria-label="Commerce Starter Home">
          Commerce Starter
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive(item.href) ? 'text-primary' : 'text-text-secondary'}`}
              aria-current={isActive(item.href) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          <Link
            href="/wishlist"
            className="relative p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
            aria-label={tNav.wishlist}
          >
            <Icon name="wishlist" size="md" />
            {wishlistItems.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-semibold bg-primary text-primary-on rounded-full flex items-center justify-center">
                {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="relative p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
            aria-label={tNav.cart}
          >
            <Icon name="cart" size="md" />
            {(itemCount > 0 || cartLoading) && (
              <span className="absolute -top-1 -right-1 w-5 h-5 text-xs font-semibold bg-primary text-primary-on rounded-full flex items-center justify-center">
                {cartLoading ? '…' : itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          {isAuthenticated ? (
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
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <Icon name="chevronDown" size="sm" className="text-text-tertiary" />
              </button>

              {userMenuOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              )}

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface rounded-lg shadow-xl border border-border py-2 z-50 animate-slide-in">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="font-medium text-text-primary truncate">{user?.name}</p>
                    <p className="text-sm text-text-tertiary truncate">{user?.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                      {user?.role === 'master_admin' && 'Master Admin'}
                      {user?.role === 'staff' && 'Staff'}
                      {user?.role === 'customer' && 'Customer'}
                    </span>
                  </div>
                  <Link
                    href="/account"
                    className="block px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-surface-hover"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {tNav.profile}
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-surface-hover"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {tNav.orders}
                  </Link>
                  <Link
                    href="/addresses"
                    className="block px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-surface-hover"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {tNav.addresses}
                  </Link>
                  <Link
                    href="/wishlist"
                    className="block px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-surface-hover"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {tNav.wishlist}
                  </Link>
                  {user?.role !== 'customer' && (
                    <Link
                      href="/admin"
                      className="block px-4 py-2 text-sm text-text-secondary hover:text-primary hover:bg-surface-hover"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      {tNav.admin}
                    </Link>
                  )}
                  <hr className="my-2 border-border" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-hover"
                  >
                    {tNav.logout}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-primary transition-colors"
              >
                {tNav.login}
              </Link>
              <Link
                href="/register"
                className="button px-4 py-2 text-sm"
              >
                {tNav.register}
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <Icon name="close" size="md" /> : <Icon name="menu" size="md" />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-border bg-surface animate-slide-down">
          <div className="shell py-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-2 rounded-lg text-base font-medium transition-colors ${isActive(item.href) ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:bg-surface-hover'}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <hr className="my-4 border-border" />
            {!isAuthenticated ? (
              <div className="flex flex-col gap-2 px-4">
                <Link
                  href="/login"
                  className="px-4 py-2 text-base font-medium text-text-secondary hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tNav.login}
                </Link>
                <Link
                  href="/register"
                  className="button w-full text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tNav.register}
                </Link>
              </div>
            ) : (
              <div className="px-4 space-y-2">
                <Link
                  href="/account"
                  className="block px-4 py-2 text-base text-text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tNav.profile}
                </Link>
                <Link
                  href="/orders"
                  className="block px-4 py-2 text-base text-text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tNav.orders}
                </Link>
                <Link
                  href="/wishlist"
                  className="block px-4 py-2 text-base text-text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {tNav.wishlist}
                </Link>
                {user?.role !== 'customer' && (
                  <Link
                    href="/admin"
                    className="block px-4 py-2 text-base text-text-secondary hover:text-primary hover:bg-surface-hover rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {tNav.admin}
                  </Link>
                )}
                <hr className="my-2 border-border" />
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-base text-error hover:bg-surface-hover rounded-lg transition-colors"
                >
                  {tNav.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function StorefrontFooter() {
  const tNav = useTranslations('navigation');
  const tFooter = useTranslations('footer');
  const locale = useTranslations('common')._options?.locale || 'en';

  const currentYear = new Date().getFullYear();

  return (
    <footer className=" bg-surface-sunken border-t border-border ">
      <div className="shell container py-12 lg:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <h3 className="font-bold text-xl text-text-primary mb-4">Commerce Starter</h3>
            <p className="text-text-secondary max-w-sm">
              A fast, secure storefront foundation. Secure Laravel APIs and a fast Next.js storefront, ready for client branding.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4">{tFooter.about}</h4>
            <ul className="space-y-2 text-text-secondary">
              <li><Link href="/about" className="hover:text-primary transition-colors">{tFooter.about}</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">{tFooter.contact}</Link></li>
              <li><Link href="/careers" className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link href="/press" className="hover:text-primary transition-colors">Press</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4">{tFooter.support}</h4>
            <ul className="space-y-2 text-text-secondary">
              <li><Link href="/faq" className="hover:text-primary transition-colors">{tFooter.faq}</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">{tFooter.shipping}</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">{tFooter.returns}</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">{tFooter.contact}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-text-primary mb-4">{tFooter.legal}</h4>
            <ul className="space-y-2 text-text-secondary">
              <li><Link href="/privacy" className="hover:text-primary transition-colors">{tFooter.privacy}</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">{tFooter.terms}</Link></li>
              <li><Link href="/cookies" className="hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-tertiary text-sm">
            © {currentYear} Commerce Starter. {tFooter.rightsReserved}
          </p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <a href="#" className="text-text-tertiary hover:text-primary transition-colors" aria-label="Twitter">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg>
            </a>
            <a href="#" className="text-text-tertiary hover:text-primary transition-colors" aria-label="Facebook">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
            </a>
            <a href="#" className="text-text-tertiary hover:text-primary transition-colors" aria-label="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function StorefrontLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col">
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}