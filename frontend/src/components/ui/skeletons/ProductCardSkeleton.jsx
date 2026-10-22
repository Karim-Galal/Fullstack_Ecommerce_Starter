'use client';

import { Card } from '../Card';
import { Skeleton } from '../Skeleton';

export function ProductCardSkeleton({ className = '' }) {
  return (
    <Card variant="default" padding="none" className={`overflow-hidden ${className}`}>
      <Skeleton variant="rectangular" className="aspect-[4/5] w-full rounded-none" />
      <div aria-hidden="true" className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-1/3" />
        <Skeleton variant="rectangular" className="h-9 w-full" />
      </div>
    </Card>
  );
}
