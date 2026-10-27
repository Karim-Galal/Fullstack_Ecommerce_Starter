'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { Icon } from '@/components/icons';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { storeConfig } from '@/config/store';
import DesktopNavigation from './DesktopNavigation';
import MobileNavigation from './MobileNavigation';
import UserMenu from './UserMenu';

const [brandLead, ...brandRestParts] = storeConfig.name.split(' ');
const brandRest = brandRestParts.join(' ');

const iconLinkClass =
  'relative flex size-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const locale = useLocale();
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
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="shell flex min-h-16 items-center justify-between gap-4 lg:min-h-20">
        <Link
          href={`/${locale}`}
          aria-label={storeConfig.name}
          className="group flex shrink-0 flex-col gap-1 leading-none"
        >
          <span className="text-[0.9rem] font-semibold uppercase tracking-[0.34em] text-text-primary">
            {brandLead}
          </span>

          {brandRest && (
            <span className="text-[0.55rem] font-medium uppercase tracking-[0.44em] text-text-tertiary transition-colors group-hover:text-accent">
              {brandRest}
            </span>
          )}
        </Link>

        <DesktopNavigation />

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <ThemeToggle className='hidden md:block' />

          <LanguageSwitcher />

          <Link
            href={`/${locale}/wishlist`}
            // className={iconLinkClass}
            className={`${iconLinkClass} hidden md:flex`}
            aria-label={tNav('wishlist')}
          >
            <Icon name="wishlist" size="md" className="text-current" />

            {wishlistItems.length > 0 && (
              <span className="absolute inset-e-0 top-0 flex size-5 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-on">
                {wishlistItems.length > 9 ? '9+' : wishlistItems.length}
              </span>
            )}
          </Link>

          <Link
            href={`/${locale}/cart`}
            className={iconLinkClass}
            aria-label={tNav('cart')}
          >
            <Icon name="cart" size="md" className="text-current" />

            {itemCount > 0 && (
              <span className="absolute inset-e-0 top-0 flex size-5 items-center justify-center rounded-full bg-primary text-[0.6rem] font-semibold text-primary-on">
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </Link>
          <div className='hidden md:block'>
            <UserMenu
              user={isAuthenticated ? user : null}
              onLogout={handleLogout}
            />
          </div>

          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
            onClick={() => setMobileMenuOpen((value) => !value)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? tNav('closeMenu') : tNav('openMenu')}
          >
            {/* <Icon name={mobileMenuOpen ? 'close' : 'menu'} size="md" /> */}
            <Icon name={mobileMenuOpen ? 'close' : 'menuTwoLines'} size="md" />
          </button>
        </div>
      </div>

      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
    </header>
  );
}
