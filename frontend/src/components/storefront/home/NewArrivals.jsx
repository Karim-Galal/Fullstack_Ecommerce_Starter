'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/skeletons/ProductGridSkeleton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Icon } from '@/components/icons';
import { getApiErrorMessage } from '@/lib/api-error';
import { getProductName } from '@/lib/product';
import { cartService, productService } from '@/services/catalog';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useToast } from '@/components/ui/feedback/ToastProvider';

const MAX_PRODUCTS = 8;

const MIN_LOADING_DURATION = 800;

function waitForMinimumDuration(startedAt) {
  const remainingTime = MIN_LOADING_DURATION - (Date.now() - startedAt);

  return remainingTime > 0
    ? new Promise((resolve) => setTimeout(resolve, remainingTime))
    : Promise.resolve();
}

export function NewArrivals() {
  const locale = useLocale();
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const setCart = useCartStore((state) => state.setCart);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const wishlistItems = useWishlistStore((state) => state.items);

  const [status, setStatus] = useState('loading');
  const [products, setProducts] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [addingIds, setAddingIds] = useState([]);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const addingRef = useRef(new Set());

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  const requestProducts = useCallback(async () => {
    const response = await productService.list({
      page: 1,
      per_page: MAX_PRODUCTS,
      sort: 'created_at',
      direction: 'desc',
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

  const loadProducts = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    try {
      const items = await requestProducts();

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      handleProductsLoaded(items);
    } catch (error) {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      handleProductsError(error);
    }
  }, [handleProductsError, handleProductsLoaded, requestProducts]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleRetry = async () => {
    const requestId = ++requestIdRef.current;

    setStatus('loading');
    setProducts([]);
    setLoadError(null);

    const startedAt = Date.now();

    try {
      const items = await requestProducts();

      await waitForMinimumDuration(startedAt);

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      handleProductsLoaded(items);
    } catch (error) {
      await waitForMinimumDuration(startedAt);

      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }

      handleProductsError(error);
    }
  };

  const handleAddToCart = async (product) => {
    if (addingRef.current.has(product.id)) return;

    addingRef.current.add(product.id);
    setAddingIds(Array.from(addingRef.current));

    try {
      const response = await cartService.add(product.id, 1);

      if (!mountedRef.current) return;

      setCart(response);
      toast({
        variant: 'success',
        title: t('arrivals.addedToCart'),
        description: getProductName(product, locale),
      });
    } catch (error) {
      if (!mountedRef.current) return;

      toast({
        variant: 'destructive',
        title: tCommon('error'),
        description: getApiErrorMessage(
          error,
          tCommon,
          t('arrivals.addError'),
        ),
      });
    } finally {
      addingRef.current.delete(product.id);

      if (mountedRef.current) {
        setAddingIds(Array.from(addingRef.current));
      }
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

          <Link
            href={`/${locale}/products?sort=created_at&direction=desc`}
            className="inline-flex items-center gap-2 text-sm font-medium text-text-primary underline-offset-4 transition-colors hover:text-accent hover:underline"
          >
            {t('arrivals.viewAll')}
            <Icon name="arrowRight" size="sm" className="rtl:rotate-180" />
          </Link>
        </div>

        <div className="mt-10 sm:mt-12">
          {status === 'loading' && (
            <div role="status" aria-label={t('arrivals.loading')}>
              <ProductGridSkeleton count={MAX_PRODUCTS} />
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
                  isAdding={addingIds.includes(product.id)}
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
