'use client';

import { Skeleton } from '../Skeleton';

export function TableSkeleton({ rows = 5, columns = 4, showHeader = true, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`w-full overflow-hidden rounded-xl border border-border bg-surface ${className}`}
    >
      {showHeader && (
        <div className="flex gap-4 border-b border-border bg-surface-sunken p-4">
          {Array.from({ length: columns }, (_, index) => (
            <Skeleton key={index} className="h-4 flex-1" />
          ))}
        </div>
      )}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex gap-4 p-4">
            {Array.from({ length: columns }, (_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
