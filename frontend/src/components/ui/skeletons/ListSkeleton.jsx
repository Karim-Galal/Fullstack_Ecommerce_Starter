'use client';

import { Skeleton } from '../Skeleton';
import { AvatarSkeleton } from './AvatarSkeleton';

export function ListSkeleton({ items = 5, lines = 2, avatar = true, className = '' }) {
  return (
    <div aria-hidden="true" className={`space-y-4 ${className}`}>
      {Array.from({ length: items }, (_, itemIndex) => (
        <div key={itemIndex} className="flex items-start gap-3">
          {avatar && <AvatarSkeleton size="md" className="mt-0.5" />}
          <div className="flex-1 space-y-2">
            {Array.from({ length: lines }, (_, lineIndex) => (
              <Skeleton
                key={lineIndex}
                className={`h-4 ${lineIndex === lines - 1 ? 'w-2/3' : 'w-full'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
