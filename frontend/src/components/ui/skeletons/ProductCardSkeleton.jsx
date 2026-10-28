'use client';

import { Skeleton } from '../Skeleton';

export function ProductCardSkeleton({ className = '' }) {
  return (
    <div aria-hidden="true" className={`flex h-full flex-col ${className}`}>
      <Skeleton
        variant="rectangular"
        className="aspect-[4/5] w-full rounded-none"
      />

      <div className="flex flex-1 flex-col gap-3 pt-4">
        <div className="flex items-start justify-between gap-4">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-4 w-16" />
        </div>

        <Skeleton className="h-3 w-2/5" />

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
