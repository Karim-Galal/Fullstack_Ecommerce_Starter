'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { Icon } from '@/components/icons';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import UserMenu from './UserMenu';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');

  const { user, isAuthenticated, logout } = useAuthStore();
  const { itemCount } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
      <div className="shell flex min-h-16 items-center justify-between gap-3">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold text-text-primary sm:text-xl"
          aria-label={tCommon('appName')}
        >
          {tCommon('appName')}
        </Link>

        <DesktopNavigation />

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LanguageSwitcher />

          <Link
            href="/wishlist"
            className="relative flex size-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
            aria-label={tNav('wishlist')}
          >
            <Icon name="wishlist" size="md" />

            {wishlistItems.length > 0 && (
              <span className="absolute end-0 top-0 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-on">
                {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
              </span>
            )}
          </Link>

          <Link
            href="/cart"
            className="relative flex size-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary"
            aria-label={tNav('cart')}
          >
            <Icon name="cart" size="md" />

            {itemCount > 0 && (
              <span className="absolute end-0 top-0 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-on">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>

          <div className="flex items-center">
            <UserMenu
              user={isAuthenticated ? user : null}
              onLogout={handleLogout}
            />
          </div>

          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-hover hover:text-primary focus-visible:outline-2 focus-visible:outline-primary md:hidden"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? tNav('closeMenu') : tNav('openMenu')}
          >
            <Icon
              name={mobileMenuOpen ? 'close' : 'menu'}
              size="md"
            />
          </button>
        </div>
      </div>


      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isAuthenticated={isAuthenticated}
      />
    </header>
  );
}