'use client';

import { Skeleton } from '../Skeleton';

export function FormSkeleton({ fields = 4, showFooter = true, className = '' }) {
  return (
    <div aria-hidden="true" className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton variant="rectangular" className="h-11 w-full" />
        </div>
      ))}
      {showFooter && (
        <div className="flex justify-end gap-3 pt-2">
          <Skeleton variant="rectangular" className="h-10 w-24" />
          <Skeleton variant="rectangular" className="h-10 w-28" />
        </div>
      )}
    </div>
  );
}
