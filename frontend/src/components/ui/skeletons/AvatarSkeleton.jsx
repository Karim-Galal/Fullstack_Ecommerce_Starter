'use client';

import { Skeleton } from '../Skeleton';

const sizeStyles = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export function AvatarSkeleton({ size = 'md', className = '' }) {
  return (
    <Skeleton
      variant="circular"
      className={`${sizeStyles[size] || sizeStyles.md} ${className}`}
    />
  );
}
