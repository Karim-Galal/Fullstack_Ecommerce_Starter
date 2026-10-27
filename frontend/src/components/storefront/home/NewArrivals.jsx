'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/skeletons/ProductGridSkeleton';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { getApiErrorMessage } from '@/lib/api-error';
import { cartService, productService } from '@/services/catalog';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';

const MAX_PRODUCTS = 8;

const MIN_LOADING_DURATION = 800;

export function NewArrivals() {
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const setCart = useCartStore((state) => state.setCart);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const wishlistItems = useWishlistStore((state) => state.items);

  const [status, setStatus] = useState('loading');
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const requestProducts = useCallback(async () => {
    const response = await productService.list({
      page: 1,
      per_page: MAX_PRODUCTS,
    });

    return Array.isArray(response?.data)
      ? response.data.slice(0, MAX_PRODUCTS)
      : [];
  }, []);

  const handleProductsLoaded = useCallback((items) => {
    if (!mountedRef.current) return;

    setProducts(items);
    setStatus('ready');
  }, []);

  const handleProductsError = useCallback((error) => {
    if (!mountedRef.current) return;

    setProducts([]);
    setLoadError(error);
    setStatus('error');
  }, []);

  useEffect(() => {
    requestProducts()
      .then(handleProductsLoaded)
      .catch(handleProductsError);
  }, [handleProductsError, handleProductsLoaded, requestProducts]);

  const handleRetry = async () => {
    setStatus('loading');
    setProducts([]);
    setLoadError(null);

    const startedAt = Date.now();

    try {
      const items = await requestProducts();

      const remainingTime =
        MIN_LOADING_DURATION - (Date.now() - startedAt);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      handleProductsLoaded(items);
    } catch (error) {
      const remainingTime =
        MIN_LOADING_DURATION - (Date.now() - startedAt);

      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      handleProductsError(error);
    }
  };

  const handleAddToCart = async (product) => {
    setActionError(null);

    try {
      const response = await cartService.add(product.id, 1);
      setCart(response);
    } catch (error) {
      if (!mountedRef.current) return;

      setActionError(
        getApiErrorMessage(error, tCommon, t('arrivals.addError')),
      );
    }
  };

  const loadErrorMessage = loadError
    ? getApiErrorMessage(loadError, tCommon)
    : t('arrivals.errorText');

  return (
    <section
      id="new-arrivals"
      className="scroll-mt-24 border-b border-border bg-surface"
    >
      <div className="shell py-20 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            eyebrow={t('arrivals.eyebrow')}
            title={t('arrivals.title')}
            description={t('arrivals.description')}
          />
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
            <EmptyState
              icon="warning"
              title={t('arrivals.errorTitle')}
              description={loadErrorMessage}
              size="lg"
              className="rounded-2xl border border-border bg-surface-elevated"
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full px-6"
                  onClick={handleRetry}
                >
                  {t('arrivals.retry')}
                </Button>
              }
            />
          )}

          {status === 'ready' && products.length === 0 && (
            <EmptyState
              icon="products"
              title={t('arrivals.emptyTitle')}
              description={t('arrivals.emptyText')}
              size="lg"
              className="rounded-2xl border border-border bg-surface-elevated"
            />
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
