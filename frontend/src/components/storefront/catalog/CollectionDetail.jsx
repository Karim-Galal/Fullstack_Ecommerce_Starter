'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EmptyState } from '@/components/ui/data-display/EmptyState';
import { ProductCard } from '@/components/storefront/ProductCard';
import { ProductGridSkeleton } from '@/components/ui/skeletons/ProductGridSkeleton';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/ui/feedback/ToastProvider';
import { getApiErrorMessage } from '@/lib/api-error';
import { cartService, collectionService } from '@/services/catalog';
import {
  getCollectionDescription,
  getCollectionName,
  getProductName,
} from '@/lib/product';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';

export function CollectionDetail() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('catalog');
  const tProduct = useTranslations('product');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const { toast } = useToast();

  const identifier = Array.isArray(params.identifier)
    ? params.identifier[0]
    : params.identifier;

  const setCart = useCartStore((state) => state.setCart);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);
  const wishlistItems = useWishlistStore((state) => state.items);

  const [collection, setCollection] = useState(null);
  const [status, setStatus] = useState('loading');
  const [addingIds, setAddingIds] = useState([]);
  const addingRef = useRef(new Set());

  const loadCollection = useCallback(() => {
    collectionService
      .get(identifier)
      .then((response) => {
        setCollection(response);
        setStatus('ready');
      })
      .catch((error) => {
        setCollection(null);
        setStatus(error?.kind === 'not_found' ? 'not-found' : 'error');
      });
  }, [identifier]);

  useEffect(() => {
    loadCollection();
  }, [loadCollection]);

  const handleRetry = () => {
    setStatus('loading');
    loadCollection();
  };

  const handleAddToCart = async (product) => {
    if (addingRef.current.has(product.id)) return;

    addingRef.current.add(product.id);
    setAddingIds(Array.from(addingRef.current));

    try {
      const response = await cartService.add(product.id, 1);
      setCart(response);
      toast({
        variant: 'success',
        title: tProduct('addedToCart'),
        description: getProductName(product, locale),
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: tCommon('error'),
        description: getApiErrorMessage(error, tCommon, t('addError')),
      });
    } finally {
      addingRef.current.delete(product.id);
      setAddingIds(Array.from(addingRef.current));
    }
  };

  const name = getCollectionName(collection, locale);
  const description = getCollectionDescription(collection, locale);
  const products = Array.isArray(collection?.products)
    ? collection.products
    : [];

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { href: `/${locale}/collections`, label: tNav('collections') },
    { label: name || identifier },
  ];

  return (
    <div className="shell py-10 sm:py-14">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />

      {status === 'loading' && <ProductGridSkeleton count={6} />}

      {status === 'error' && (
        <div className="rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-sunken text-text-secondary">
            <Icon name="warning" size="lg" />
          </div>
          <h1 className="mt-5 text-xl font-medium text-text-primary">
            {t('collectionsPage.errorTitle')}
          </h1>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-6 rounded-full px-6"
            onClick={handleRetry}
          >
            {t('collectionsPage.retry')}
          </Button>
        </div>
      )}

      {status === 'not-found' && (
        <EmptyState
          icon="layers"
          title={t('collectionsPage.emptyTitle')}
          description={t('collectionsPage.emptyText')}
          action={
            <Link
              href={`/${locale}/collections`}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-6 text-sm font-medium text-text-primary transition-colors hover:bg-surface-hover"
            >
              {t('collectionsPage.viewCollection')}
            </Link>
          }
        />
      )}

      {status === 'ready' && collection && (
        <>
          <header className="max-w-2xl">
            <SectionHeading
              as="h1"
              eyebrow={t('collectionsPage.eyebrow')}
              title={name}
              description={description}
              className="max-w-2xl"
              titleClassName="text-4xl font-normal tracking-[-0.035em] text-text-primary sm:text-5xl"
              descriptionClassName="mt-4 text-sm leading-7 text-text-secondary sm:text-base"
            />
            <p className="mt-4 text-xs uppercase tracking-[0.22em] text-text-tertiary">
              {t('collectionsPage.pieces', { count: products.length })}
            </p>
          </header>

          <div className="mt-10">
            {products.length === 0 ? (
              <EmptyState
                icon="products"
                title={t('emptyTitle')}
                description={t('emptyText')}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
        </>
      )}
    </div>
  );
}

export default CollectionDetail;
