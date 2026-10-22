'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/navigation/Breadcrumbs';
import { ProductCard } from '@/components/storefront/ProductCard';
import { PageSkeleton } from '@/components/ui/skeletons/PageSkeleton';
import { Icon } from '@/components/icons';
import { cartService, productService } from '@/services/catalog';
import {
  formatProductPrice,
  getCategoryName,
  getProductDescription,
  getProductImage,
  getProductImages,
  getProductName,
} from '@/lib/product';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';

export function ProductDetail() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations('product');
  const tNav = useTranslations('navigation');

  const identifier = Array.isArray(params.identifier)
    ? params.identifier[0]
    : params.identifier;

  const setCart = useCartStore((state) => state.setCart);
  const wishlistItems = useWishlistStore((state) => state.items);
  const toggleWishlist = useWishlistStore((state) => state.toggleItem);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [status, setStatus] = useState('loading');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [adding, setAdding] = useState(false);

  const loadProduct = useCallback(() => {
    productService
      .get(identifier)
      .then((response) => {
        setProduct(response);
        setQuantity(1);
        setSelectedImage(0);
        setStatus('ready');

        if (response?.category_id) {
          productService
            .list({
              category_id: response.category_id,
              per_page: 5,
              sort: 'created_at',
              direction: 'desc',
            })
            .then((relatedResponse) => {
              const items = Array.isArray(relatedResponse?.data)
                ? relatedResponse.data
                : [];
              setRelated(
                items.filter((item) => item.id !== response.id).slice(0, 4),
              );
            })
            .catch(() => setRelated([]));
        } else {
          setRelated([]);
        }
      })
      .catch((error) => {
        setProduct(null);
        setRelated([]);
        setStatus(error?.kind === 'not_found' ? 'not-found' : 'error');
      });
  }, [identifier]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleRetry = () => {
    setStatus('loading');
    setFeedback(null);
    loadProduct();
  };

  const images = useMemo(() => getProductImages(product), [product]);
  const primaryImage = getProductImage(product, 'card');
  const productName = getProductName(product, locale);
  const description = getProductDescription(product, locale);
  const categoryName = getCategoryName(product?.category, locale);
  const stock = Number(product?.stock ?? 0);
  const inStock = stock > 0;
  const isInWishlist = wishlistItems.some(
    (item) => item.product_id === product?.id,
  );

  const handleAddToCart = async (productToAdd = product, amount = quantity) => {
    setAdding(true);
    setFeedback(null);

    try {
      const response = await cartService.add(productToAdd.id, amount);
      setCart(response);
      setFeedback({ variant: 'success', message: t('addedToCart') });
    } catch (error) {
      setFeedback({
        variant: 'destructive',
        message: error.message || t('addError'),
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRelatedAdd = async (relatedProduct) => {
    setFeedback(null);

    try {
      const response = await cartService.add(relatedProduct.id, 1);
      setCart(response);
      setFeedback({ variant: 'success', message: t('addedToCart') });
    } catch (error) {
      setFeedback({
        variant: 'destructive',
        message: error.message || t('addError'),
      });
    }
  };

  const breadcrumbItems = [
    { href: `/${locale}`, label: tNav('home') },
    { href: `/${locale}/products`, label: tNav('shop') },
    { label: productName || identifier },
  ];

  if (status === 'loading') {
    return (
      <div className="shell py-14">
        <PageSkeleton />
      </div>
    );
  }

  if (status === 'error' || status === 'not-found' || !product) {
    return (
      <div className="shell py-14">
        <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />
        <div className="rounded-2xl border border-border bg-surface-elevated px-6 py-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-sunken text-text-secondary">
            <Icon name="warning" size="lg" />
          </div>
          <h1 className="mt-5 text-xl font-medium text-text-primary">
            {status === 'not-found' ? t('notFoundTitle') : t('loadErrorTitle')}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
            {status === 'not-found' ? t('notFoundText') : t('loadErrorText')}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full px-6"
              onClick={handleRetry}
            >
              {t('retry')}
            </Button>
            <Link
              href={`/${locale}/products`}
              className="inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {t('backToShop')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell py-10 sm:py-14">
      <Breadcrumbs items={breadcrumbItems} className="mb-8 text-sm" />

      {feedback && (
        <Alert
          variant={feedback.variant}
          description={feedback.message}
          dismissible
          onDismiss={() => setFeedback(null)}
          className="mb-8"
        />
      )}

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
        <section aria-label={t('gallery')}>
          <div className="overflow-hidden rounded-3xl border border-border bg-surface-sunken">
            {images[selectedImage] ? (
              <img
                src={images[selectedImage].url}
                alt={images[selectedImage].alt || productName}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : primaryImage ? (
              <img
                src={primaryImage}
                alt={productName}
                className="aspect-[4/5] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center bg-gradient-to-br from-[#f8f5f0] to-[#e9e3d9]">
                <span
                  aria-hidden="true"
                  className="block size-24 rounded-full border-[10px] border-[#d3ccc0] shadow-inner"
                />
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {images.map((image, index) => (
                <button
                  key={image.id || image.url}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  aria-label={t('image', { index: index + 1 })}
                  aria-current={index === selectedImage ? 'true' : undefined}
                  className={`overflow-hidden rounded-xl border transition-colors ${
                    index === selectedImage
                      ? 'border-text-primary'
                      : 'border-border hover:border-border-strong'
                  }`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || productName}
                    loading="lazy"
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex flex-wrap items-center gap-2">
            {categoryName && (
              <Badge variant="outline" size="sm">
                {categoryName}
              </Badge>
            )}
            <Badge
              variant={inStock ? 'success' : 'default'}
              size="sm"
              dot
            >
              {inStock ? t('inStock') : t('outOfStock')}
            </Badge>
          </div>

          <h1 className="mt-5 text-3xl font-normal tracking-[-0.03em] text-text-primary sm:text-4xl">
            {productName}
          </h1>

          <p className="mt-4 text-2xl font-medium text-text-primary">
            {formatProductPrice(product.price, locale, product.currency)}
          </p>

          {inStock && stock <= 5 && (
            <p className="mt-2 text-sm text-text-secondary">
              {t('lowStock', { count: stock })}
            </p>
          )}

          {description && (
            <p className="mt-6 max-w-prose text-sm leading-7 text-text-secondary sm:text-base">
              {description}
            </p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <span>{t('quantity')}</span>
              <input
                type="number"
                min="1"
                max={Math.max(stock, 1)}
                value={quantity}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setQuantity(
                    Number.isFinite(next)
                      ? Math.min(Math.max(next, 1), Math.max(stock, 1))
                      : 1,
                  );
                }}
                disabled={!inStock}
                className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </label>

            <Button
              type="button"
              size="lg"
              className="min-w-44 rounded-full"
              onClick={() => handleAddToCart()}
              loading={adding}
              disabled={!inStock}
            >
              {inStock ? t('addToCart') : t('outOfStock')}
            </Button>

            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-pressed={isInWishlist}
              className={`inline-flex size-12 items-center justify-center rounded-full border transition-colors ${
                isInWishlist
                  ? 'border-accent bg-accent-light text-accent'
                  : 'border-border text-text-secondary hover:border-border-strong hover:text-text-primary'
              }`}
              aria-label={
                isInWishlist
                  ? t('removeFromWishlist')
                  : t('addToWishlist')
              }
            >
              <Icon
                name="wishlist"
                size="md"
                className={isInWishlist ? 'fill-current' : ''}
              />
            </button>
          </div>

          <dl className="mt-10 space-y-3 border-t border-border pt-6 text-sm">
            {product.sku && (
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">{t('sku')}</dt>
                <dd className="text-text-primary">{product.sku}</dd>
              </div>
            )}
            {categoryName && (
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">{t('category')}</dt>
                <dd className="text-text-primary">{categoryName}</dd>
              </div>
            )}
            {inStock && (
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">{t('inStock')}</dt>
                <dd className="text-text-primary">
                  {t('inStockCount', { count: stock })}
                </dd>
              </div>
            )}
          </dl>
        </section>
      </div>

      <section className="mt-16 border-t border-border pt-12 sm:mt-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-normal tracking-[-0.03em] text-text-primary sm:text-3xl">
            {t('related')}
          </h2>
          <Link
            href={
              product.category_id
                ? `/${locale}/products?category_id=${product.category_id}`
                : `/${locale}/products`
            }
            className="text-sm font-medium text-text-secondary underline-offset-4 transition-colors hover:text-text-primary hover:underline"
          >
            {t('viewAll')}
          </Link>
        </div>

        {related.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard
                key={item.id}
                product={item}
                onAddToCart={handleRelatedAdd}
                onAddToWishlist={toggleWishlist}
                isInWishlist={wishlistItems.some(
                  (wishlistItem) => wishlistItem.product_id === item.id,
                )}
              />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-sm text-text-secondary">
            {t('relatedEmpty')}
          </p>
        )}
      </section>
    </div>
  );
}

export default ProductDetail;
