'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/icons';
import { storeConfig } from '@/config/store';
import {
  formatProductPrice,
  getProductImage,
  getProductName,
} from '@/lib/product';

export const ProductCard = ({
  product,
  className = '',
  onAddToCart,
  onAddToWishlist,
  isInWishlist = false,
}) => {
  const locale = useLocale();
  const tProduct = useTranslations('product');

  const primaryImage = product.images?.[0];
  const productName = getProductName(product, locale);

  const stock = Number(product.stock ?? 0);
  const inStock = stock > 0;
  const lowStock = inStock && stock <= 5;

  const currency = product.currency || storeConfig.currency;
  const formatPrice = (value) =>
    formatProductPrice(value, locale, currency);

  const price = formatPrice(product.price);
  const originalPriceValue =
    product.original_price ?? product.compare_at_price ?? null;

  const hasOriginalPrice =
    originalPriceValue !== null &&
    Number(originalPriceValue) > Number(product.price);

  const imageUrl =
    getProductImage(product) ||
    primaryImage?.url ||
    primaryImage?.path ||
    null;

  const imageAlt = primaryImage?.alt || productName;
  const productHref = `/${locale}/products/${encodeURIComponent(
    product.slug || product.id,
  )}`;

  const handleAddToCart = () => {
    if (!inStock || typeof onAddToCart !== 'function') return;
    onAddToCart(product);
  };

  const handleWishlistToggle = () => {
    if (typeof onAddToWishlist !== 'function') return;
    onAddToWishlist(product);
  };

  return (
    <Card
      className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-surface-elevated shadow-none transition-all duration-300 hover:border-border-strong hover:shadow-md ${className}`}
      variant="default"
      padding="none"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken">
        <Link
          href={productHref}
          aria-label={productName}
          className="absolute inset-0 block"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
          ) : (
            <div
              className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-[#f8f5f0] to-[#e9e3d9] text-text-tertiary"
              aria-label={imageAlt}
            >
              <span
                aria-hidden="true"
                className="block size-16 rounded-full border-[7px] border-[#d3ccc0] shadow-inner"
              />
              <span className="text-[0.6rem] uppercase tracking-[0.24em]">
                {storeConfig.name}
              </span>
            </div>
          )}
        </Link>

        {!inStock && (
          <span className="absolute start-3 top-3 rounded-full border border-border bg-surface/95 px-2.5 py-1 text-[0.65rem] font-medium text-text-secondary backdrop-blur">
            {tProduct('outOfStock')}
          </span>
        )}

        {lowStock && (
          <span className="absolute start-3 top-3 rounded-full bg-accent-light px-2.5 py-1 text-[0.65rem] font-medium text-text-primary">
            {tProduct('lowStock', { count: stock })}
          </span>
        )}

        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={typeof onAddToWishlist !== 'function'}
          aria-label={
            isInWishlist
              ? tProduct('removeFromWishlist')
              : tProduct('addToWishlist')
          }
          aria-pressed={isInWishlist}
          className={`absolute end-3 top-3 flex size-10 items-center justify-center rounded-full border border-border/70 bg-surface/95 text-text-primary shadow-sm backdrop-blur transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50 ${
            isInWishlist ? 'text-accent' : ''
          }`}
        >
          <Icon
            name="wishlist"
            size="sm"
            className={isInWishlist ? 'fill-current' : ''}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-[0.95rem] font-medium leading-6 text-text-primary">
          <Link
            href={productHref}
            className="transition-colors hover:text-accent"
          >
            {productName}
          </Link>
        </h3>

        <div className="mt-auto flex flex-wrap items-baseline gap-2">
          <span className="text-sm font-semibold text-text-primary">
            {price}
          </span>

          {hasOriginalPrice && (
            <span className="text-xs text-text-tertiary line-through">
              {formatPrice(originalPriceValue)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock || typeof onAddToCart !== 'function'}
          className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-border-strong bg-transparent px-4 text-xs font-semibold transition-colors hover:border-primary hover:bg-primary hover:text-primary-on focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="cart" size="xs" />
          <span>{tProduct('addToCart')}</span>
        </button>
      </div>
    </Card>
  );
};

export default ProductCard;
