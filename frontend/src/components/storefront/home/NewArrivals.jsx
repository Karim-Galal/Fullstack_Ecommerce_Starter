'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/skeletons/ProductGridSkeleton';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Icon } from '@/components/icons';
import { cartService, productService } from '@/services/catalog';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';

const MAX_PRODUCTS = 8;

export function NewArrivals() {
  const t = useTranslations('home');
  const setCart = useCartStore((state) => state.setCart);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const wishlistItems = useWishlistStore((state) => state.items);

  const [status, setStatus] = useState('loading');
  const [products, setProducts] = useState([]);
  const [actionError, setActionError] = useState(null);

  const requestProducts = useCallback(async () => {
    const response = await productService.list({ page: 1, per_page: MAX_PRODUCTS });

    return Array.isArray(response?.data)
      ? response.data.slice(0, MAX_PRODUCTS)
      : [];
  }, []);

  useEffect(() => {
    let cancelled = false;

    requestProducts()
      .then((items) => {
        if (cancelled) return;

        setProducts(items);
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;

        setProducts([]);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [requestProducts]);

  const handleRetry = () => {
    setStatus('loading');
    setProducts([]);

    requestProducts()
      .then((items) => {
        setProducts(items);
        setStatus('ready');
      })
      .catch(() => {
        setProducts([]);
        setStatus('error');
      });
  };

  const handleAddToCart = async (product) => {
    setActionError(null);

    try {
      const response = await cartService.add(product.id, 1);
      setCart(response);
    } catch (error) {
      setActionError(error.message || t('arrivals.addError'));
    }
  };

  return (
    <section
      id="new-arrivals"
      className="scroll-mt-24 border-b border-border bg-surface"
    >
      <div className="shell py-20 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <p className="eyebrow">{t('arrivals.eyebrow')}</p>

            <h2 className="mt-4 text-3xl font-normal tracking-[-0.03em] text-text-primary sm:text-4xl">
              {t('arrivals.title')}
            </h2>

            <p className="mt-4 text-sm leading-6 text-text-secondary sm:text-base">
              {t('arrivals.description')}
            </p>
          </div>
        </div>

        {actionError && (
          <Alert
            variant="destructive"
            description={actionError}
            dismissible
            onDismiss={() => setActionError(null)}
            className="mt-8"
          />
        )}

        <div className="mt-10 sm:mt-12">
          {status === 'loading' && (
            <div role="status" aria-label={t('arrivals.loading')}>
              <ProductGridSkeleton count={4} />
              <span className="sr-only">{t('arrivals.loading')}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-sunken text-text-secondary">
                <Icon name="warning" size="lg" />
              </div>

              <h3 className="mt-5 text-xl font-medium text-text-primary">
                {t('arrivals.errorTitle')}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
                {t('arrivals.errorText')}
              </p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-6 rounded-full px-6"
                onClick={handleRetry}
              >
                {t('arrivals.retry')}
              </Button>
            </div>
          )}

          {status === 'ready' && products.length === 0 && (
            <div className="rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-sunken text-text-secondary">
                <Icon name="products" size="lg" />
              </div>

              <h3 className="mt-5 text-xl font-medium text-text-primary">
                {t('arrivals.emptyTitle')}
              </h3>

              <p className="mx-auto mt-2 max-w-sm text-sm text-text-secondary">
                {t('arrivals.emptyText')}
              </p>
            </div>
          )}

          {status === 'ready' && products.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={toggleWishlist}
                  isInWishlist={wishlistItems.some(
                    (item) => item.product_id === product.id,
                  )}
                />
              ))}
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-text-tertiary">
          {t('arrivals.availabilityNote')}
        </p>
      </div>
    </section>
  );
}

export default NewArrivals;
