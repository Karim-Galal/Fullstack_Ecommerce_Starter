'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Alert } from '@/components/ui/Alert';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/skeletons/ProductGridSkeleton';
import { cartService } from '@/services/catalog';
import { useAuthStore } from '@/stores/authStore';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useIsMounted } from '@/lib/use-mounted';

export function WishlistPage() {
  const locale = useLocale();
  const t = useTranslations('wishlist');
  const tNav = useTranslations('navigation');

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setCart = useCartStore((state) => state.setCart);
  const items = useWishlistStore((state) => state.items);
  const toggleItem = useWishlistStore((state) => state.toggleItem);

  const mounted = useIsMounted();
  const [actionError, setActionError] = useState(null);

  const handleAddToCart = async (product) => {
    setActionError(null);

    try {
      const response = await cartService.add(product.id, 1);
      setCart(response);
    } catch (error) {
      setActionError(error.message || t('errorText'));
    }
  };

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { label: tNav('wishlist') },
  ];

  return (
    <div className="shell py-10 sm:py-14">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />

      <SectionHeading
        as="h1"
        eyebrow={t('eyebrow')}
        title={t('title')}
        description={t('description')}
        className="max-w-2xl"
        titleClassName="text-4xl font-normal tracking-[-0.035em] text-text-primary sm:text-5xl"
        descriptionClassName="mt-4 text-sm leading-7 text-text-secondary sm:text-base"
      />

      {actionError && (
        <Alert
          variant="destructive"
          description={actionError}
          dismissible
          onDismiss={() => setActionError(null)}
          className="mt-8"
        />
      )}

      {!isAuthenticated && (
        <div className="mt-8 rounded-2xl border border-border bg-surface-elevated px-5 py-4 text-sm text-text-secondary">
          {t('loginNote')}{' '}
          <Link
            href={`/${locale}/login?callbackUrl=${encodeURIComponent(
              `/${locale}/wishlist`,
            )}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {tNav('login')}
          </Link>
        </div>
      )}

      <div className="mt-10">
        {!mounted && (
          <div role="status" aria-label={t('loading')}>
            <ProductGridSkeleton count={4} />
            <span className="sr-only">{t('loading')}</span>
          </div>
        )}

        {mounted && items.length === 0 && (
          <EmptyState
            icon="wishlist"
            title={t('empty')}
            description={t('emptyMessage')}
            action={
              <Link
                href={`/${locale}/products`}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
              >
                {t('browse')}
              </Link>
            }
          />
        )}

        {mounted && items.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <ProductCard
                key={item.product_id}
                product={item.product}
                onAddToCart={handleAddToCart}
                onAddToWishlist={toggleItem}
                isInWishlist
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default WishlistPage;
