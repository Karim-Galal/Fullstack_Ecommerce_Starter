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
      className={`group/product flex h-full flex-col ${className}`}
    >
      <div className="relative overflow-hidden bg-surface-sunken">
        <Link
          href={productHref}
          aria-label={productName}
          className="block aspect-[4/5] overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-primary"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={imageAlt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover/product:scale-[1.035]"
            />
          ) : (
            <div
              className="relative flex h-full w-full flex-col items-center justify-center gap-5 overflow-hidden text-text-tertiary"
              aria-label={imageAlt}
            >
              <span
                aria-hidden="true"
                className="absolute size-56 rounded-full border border-border/70"
              />
              <span
                aria-hidden="true"
                className="absolute size-36 rounded-full border border-border-strong/60"
              />
              <span
                aria-hidden="true"
                className="size-14 rounded-full border border-border-strong bg-surface/40 shadow-inner"
              />
              <span className="relative text-[0.55rem] font-medium uppercase tracking-[0.32em]">
                {storeConfig.name}
              </span>
            </div>
          )}

          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/product:opacity-100"
          />
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
          className={`absolute end-3 top-3 flex size-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-40 ${
            isInWishlist
              ? 'border-border bg-surface text-accent'
              : 'border-white/25 bg-black/20 text-white hover:border-border hover:bg-surface hover:text-text-primary'
          }`}
        >
          <Icon
            name="wishlist"
            size="sm"
            className={isInWishlist ? 'fill-current' : ''}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-start justify-between gap-4">
          <h3
            id={titleId}
            className="line-clamp-2 min-h-12 text-[0.95rem] font-medium leading-6 text-text-primary"
          >
            <Link
              href={productHref}
              className="transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {productName}
            </Link>
          </h3>

          <div className="shrink-0 text-end">
            <span className="block text-sm font-medium tracking-tight text-text-primary">
              {price}
            </span>

            {hasOriginalPrice && !offerText && (
              <span className="mt-0.5 block text-[0.7rem] text-text-tertiary line-through">
                {formatPrice(originalPriceValue)}
              </span>
            )}
          </div>
        </div>

        {offerText && (
          <p
            className="mt-2 text-[0.68rem] font-medium uppercase tracking-[0.12em] text-accent"
            title={activeOffer?.name || tProduct('offerAtCheckout')}
          >
            {tProduct('offerBadge')}: {offerText}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/70 pt-3">
          <span className="inline-flex items-center gap-1.5 text-[0.62rem] font-medium uppercase tracking-[0.14em] text-text-tertiary">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${
                inStock
                  ? lowStock
                    ? 'bg-warning'
                    : 'bg-success'
                  : 'bg-text-tertiary'
              }`}
            />
            {inStock
              ? lowStock
                ? tProduct('lowStock', { count: stock })
                : tProduct('inStock')
              : tProduct('outOfStock')}
          </span>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={
              !inStock ||
              isAdding ||
              typeof onAddToCart !== 'function'
            }
            className="group/add inline-flex min-h-9 items-center gap-1.5 text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-text-primary transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-text-tertiary"
          >
            {isAdding ? (
              <span
                aria-hidden="true"
                className="size-3.5 animate-spin rounded-full border border-current border-t-transparent motion-reduce:animate-none"
              />
            ) : (
              <Icon
                name="cart"
                size="sm"
                aria-hidden="true"
                className="transition-transform group-hover/add:-translate-y-0.5"
              />
            )}

            {inStock ? tProduct('addToCart') : tProduct('outOfStock')}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
