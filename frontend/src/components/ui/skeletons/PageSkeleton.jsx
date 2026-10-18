'use client';

import { Skeleton } from '../Skeleton';
import { ProductGridSkeleton } from './ProductGridSkeleton';

export function PageSkeleton({ cards = 8, className = '' }) {
  return (
    <div aria-hidden="true" className={`space-y-8 ${className}`}>
      <div className="space-y-3">
        <Skeleton className="h-8 w-2/5" />
        <Skeleton className="h-4 w-3/5" />
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton variant="rectangular" className="h-10 w-28" />
        <Skeleton variant="rectangular" className="h-10 w-28" />
        <Skeleton variant="rectangular" className="h-10 w-40" />
      </div>
      <ProductGridSkeleton count={cards} />
    </div>
  );
}
