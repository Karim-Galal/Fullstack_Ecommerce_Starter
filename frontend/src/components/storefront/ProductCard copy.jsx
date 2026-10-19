'use client';

import { Card } from '@/components/ui/Card';

export const ProductCard = ({
  product,
  className = '',
  onAddToCart,
  onAddToWishlist,
  isInWishlist = false,
}) => {
  const primaryImage = product.images?.[0];
  const price = product.price
    ? new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
      }).format(product.price)
    : '';

  const originalPrice = product.original_price
    ? new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
      }).format(product.original_price)
    : null;

  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <Card className={`group ${className}`} variant="default" padding="none">
      <div className="relative aspect-square overflow-hidden bg-surface-sunken">
        {primaryImage?.variants?.card ? (
          <img
            src={primaryImage.variants.card}
            alt={primaryImage.alt || product.translations?.[0]?.name || ''}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-tertiary">
            <svg
              className="h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {!inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="rounded bg-error px-3 py-1 text-sm font-medium text-error-on">
              Out of Stock
            </span>
          </div>
        )}

        {lowStock && inStock && (
          <div className="absolute right-2 top-2 rounded-full bg-warning px-2 py-1 text-xs font-medium text-warning-on">
            Only {product.stock} left
          </div>
        )}

        <button
          type="button"
          onClick={onAddToWishlist}
          className="absolute left-2 top-2 rounded-full bg-white/90 p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
          aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            className={`h-5 w-5 ${isInWishlist ? 'fill-current text-error' : 'text-text-secondary'}`}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 font-medium text-text-primary transition-colors group-hover:text-primary">
          {product.translations?.[0]?.name || product.slug}
        </h3>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary">{price}</span>
          {originalPrice && (
            <span className="text-sm text-text-tertiary line-through">
              {originalPrice}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          disabled={!inStock}
          className="button w-full py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Cart
        </button>
      </div>
    </Card>
  );
};