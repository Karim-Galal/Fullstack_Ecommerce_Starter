'use client';

import { Skeleton } from '../Skeleton';

export function TextSkeleton({ lines = 3, widths, className = '', lineClassName = '' }) {
  return (
    <div aria-hidden="true" className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }, (_, index) => {
        const defaultWidth =
          index === lines - 1 && lines > 1 ? '70%' : '100%';
        return (
          <Skeleton
            key={index}
            width={widths?.[index] || defaultWidth}
            className={`h-4 ${lineClassName}`}
          />
        );
      })}
    </div>
  );
}
