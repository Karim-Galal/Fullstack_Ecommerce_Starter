'use client';

import { ProductCardSkeleton } from './ProductCardSkeleton';

export function ProductGridSkeleton({ count = 8, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${className}`}
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
