'use client';

import { useId } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Icon } from '@/components/icons';
import { storeConfig } from '@/config/store';
import {
  formatProductPrice,
  getProductImage,
  getProductName,
} from '@/lib/product';

function getActiveOffer(offers) {
  if (!Array.isArray(offers)) return null;

  const now = Date.now();

  return (
    offers.find((offer) => {
      if (!offer || offer.is_active === false) return false;

      const startsAt = offer.starts_at
        ? new Date(offer.starts_at).getTime()
        : null;
      const endsAt = offer.ends_at
        ? new Date(offer.ends_at).getTime()
        : null;

      if (startsAt !== null && !Number.isNaN(startsAt) && startsAt > now) {
        return false;
      }

      if (endsAt !== null && !Number.isNaN(endsAt) && endsAt < now) {
        return false;
      }

      return true;
    }) || null
  );
}

function getOfferText(offer, tProduct, locale, currency) {
  if (!offer) return null;

  if (offer.type === 'percentage') {
    const value = Number(offer.value);

    return value > 0
      ? tProduct('offerPercentage', {
          value: new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
            maximumFractionDigits: 2,
          }).format(value),
        })
      : null;
  }

  if (offer.type === 'fixed') {
    const value = Number(offer.value);

    return value > 0
      ? tProduct('offerFixed', {
          amount: formatProductPrice(value, locale, currency),
        })
      : null;
  }

  if (offer.type === 'buy_x_get_y') {
    const buy = Number(offer.buy_quantity);
    const get = Number(offer.get_quantity);

    return buy > 0 && get > 0
      ? tProduct('offerBuyXGetY', { buy, get })
      : null;
  }

  return null;
}

export const ProductCard = ({
  product,
  className = '',
  onAddToCart,
  onAddToWishlist,
  isInWishlist = false,
  isAdding = false,
}) => {
  const locale = useLocale();
  const tProduct = useTranslations('product');
  const generatedTitleId = useId();

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

  const imageUrl = getProductImage(product);
  const imageAlt = primaryImage?.alt || productName;
  const productHref = `/${locale}/products/${encodeURIComponent(
    product.slug || product.id,
  )}`;
  const titleId = `${generatedTitleId}-title`;

  const activeOffer = getActiveOffer(product.offers);
  const offerText = getOfferText(
    activeOffer,
    tProduct,
    locale,
    currency,
  );

  const handleAddToCart = () => {
    if (
      !inStock ||
      isAdding ||
      typeof onAddToCart !== 'function'
    ) {
      return;
    }

    onAddToCart(product);
  };

  const handleWishlistToggle = () => {
    if (typeof onAddToWishlist !== 'function') return;
    onAddToWishlist(product);
  };

  return (
    <article
      aria-labelledby={titleId}
      className={`group/product flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-border-strong hover:shadow-md motion-reduce:transition-none ${className}`}
    >
      <div className="relative overflow-hidden rounded-lg bg-surface-sunken ">
        <Link
          href={productHref}
          aria-label={productName}
          className="relative block aspect-[4/3] overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain p-3 transition-transform duration-500 ease-out group-hover/product:scale-[1.025] sm:p-4 motion-reduce:transform-none motion-reduce:transition-none"
            />
          ) : (
            <div
              className="relative flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden text-text-tertiary"
              aria-label={imageAlt}
            >
              <span
                aria-hidden="true"
                className="absolute size-36 rounded-full border border-border/70 sm:size-44"
              />
              <span
                aria-hidden="true"
                className="absolute size-24 rounded-full border border-border-strong/60 sm:size-32"
              />
              <span
                aria-hidden="true"
                className="size-12 rounded-full border border-border-strong bg-surface/50 shadow-inner"
              />
              <span className="relative text-[0.55rem] font-medium uppercase tracking-[0.25em]">
                {storeConfig.name}
              </span>
            </div>
          )}
        </Link>

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
          className={`absolute end-2 top-2 flex size-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40 ${
            isInWishlist
              ? 'border-border bg-surface text-accent'
              : 'border-border/70 bg-surface/95 text-text-primary hover:bg-surface-sunken'
          }`}
        >
          <Icon
            name="wishlist"
            size="sm"
            className={isInWishlist ? 'fill-current' : ''}
          />
        </button>

        {offerText && (
          <span className="absolute start-2 top-2 max-w-[65%] truncate rounded-md border border-border/60 bg-surface/95 px-2 py-1 text-[0.65rem] font-semibold text-text-primary shadow-sm">
            {tProduct('offerBadge')}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
        <div className="flex flex-1 flex-col gap-2">
          <h3
            id={titleId}
            className="line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-text-primary sm:text-[0.95rem]"
          >
            <Link
              href={productHref}
              className="rounded-sm transition-colors duration-200 hover:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {productName}
            </Link>
          </h3>

          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-base font-semibold tracking-tight text-text-primary">
              {price}
            </span>

            {hasOriginalPrice && !offerText && (
              <span className="text-xs text-text-tertiary line-through">
                {formatPrice(originalPriceValue)}
              </span>
            )}
          </div>

          {offerText && (
            <p
              className="line-clamp-2 text-xs leading-5 text-text-secondary"
              title={activeOffer?.name || tProduct('offerAtCheckout')}
            >
              {offerText}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3">
          <span
            aria-hidden="true"
            className={`size-1.5 shrink-0 rounded-full ${
              inStock
                ? lowStock
                  ? 'bg-warning'
                  : 'bg-success'
                : 'bg-text-tertiary'
            }`}
          />
          <span
            className={`min-w-0 truncate text-xs ${
              !inStock
                ? 'text-text-tertiary'
                : lowStock
                  ? 'text-warning'
                  : 'text-text-secondary'
            }`}
          >
            {inStock
              ? lowStock
                ? tProduct('lowStock', { count: stock })
                : tProduct('inStock')
              : tProduct('outOfStock')}
          </span>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            isAdding ||
            typeof onAddToCart !== 'function'
          }
          aria-busy={isAdding}
          className="mt-3 cursor-pointer inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#292824] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,box-shadow,transform] duration-200 hover:bg-[#1D1C19] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-text-tertiary disabled:shadow-none motion-reduce:transform-none motion-reduce:transition-none"
        >
          {isAdding ? (
            <>
              <span
                aria-hidden="true"
                className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
              />
              <span>{tProduct('addingToCart')}</span>
            </>
          ) : (
            <>
              <Icon name="cart" size="sm" aria-hidden="true" />
              <span>
                {inStock
                  ? tProduct('addToCart')
                  : tProduct('outOfStock')}
              </span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};

export default ProductCard;