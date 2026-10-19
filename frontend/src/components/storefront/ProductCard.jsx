'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/icons';

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
  const productName =
    product.translations?.find((translation) => translation.locale === locale)
      ?.name ||
    product.translations?.[0]?.name ||
    product.name ||
    product.slug ||
    '';

  const stock = Number(product.stock ?? 0);
  const inStock = stock > 0;
  const lowStock = inStock && stock <= 5;

  const currency = product.currency || 'EGP';
  const formatPrice = (value) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
      style: 'currency',
      currency,
    }).format(Number(value ?? 0));

  const price = formatPrice(product.price);
  const originalPriceValue =
    product.original_price ?? product.compare_at_price ?? null;

  const hasOriginalPrice =
    originalPriceValue !== null &&
    Number(originalPriceValue) > Number(product.price);

  const imageUrl =
    primaryImage?.variants?.card ||
    primaryImage?.url ||
    primaryImage?.path ||
    null;

  const imageAlt = primaryImage?.alt || productName;

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
      className={`group h-full overflow-hidden ${className}`}
      variant="default"
      padding="none"
    >
      <div className="relative aspect-square overflow-hidden bg-surface-sunken">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={imageAlt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-text-secondary"
            aria-label={imageAlt}
          >
            <Icon name="image" size="2xl" />
          </div>
        )}

        {!inStock && (
          <span className="absolute start-3 top-3 rounded-md bg-surface px-2 py-1 text-xs font-medium text-text-secondary shadow-sm">
            {tProduct('outOfStock')}
          </span>
        )}

        {lowStock && (
          <span className="absolute start-3 top-3 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
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
          className="absolute end-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface text-text-primary shadow-sm transition-colors hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon
            name="wishlist"
            size="md"
            className={isInWishlist ? 'fill-current text-red-500' : ''}
          />
        </button>
      </div>

      <div className="flex h-full flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-sm font-medium text-text-primary">
          {productName}
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-text-primary">{price}</span>

          {hasOriginalPrice && (
            <span className="text-sm text-text-secondary line-through">
              {formatPrice(originalPriceValue)}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!inStock || typeof onAddToCart !== 'function'}
          className="mt-auto flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="cart" size="sm" />
          <span>{tProduct('addToCart')}</span>
        </button>
      </div>
    </Card>
  );
};

export default ProductCard;