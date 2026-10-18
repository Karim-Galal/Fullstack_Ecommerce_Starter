'use client';

import { forwardRef, useState } from 'react';

const sizeStyles = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-16 w-16 text-lg',
  '2xl': 'h-20 w-20 text-xl',
};

const statusStyles = {
  online: 'bg-success',
  offline: 'bg-neutral-400',
  away: 'bg-warning',
  busy: 'bg-error',
};

const statusSizes = {
  xs: 'h-1.5 w-1.5',
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
  xl: 'h-3.5 w-3.5',
  '2xl': 'h-4 w-4',
};

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export const Avatar = forwardRef(function Avatar(
  {
    src,
    alt,
    name = '',
    size = 'md',
    status,
    rounded = 'full',
    className = '',
    imgClassName = '',
    fallbackClassName = '',
    ...props
  },
  ref
) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(src) && !failed;
  const initials = getInitials(name);
  const radius = rounded === 'full' ? 'rounded-full' : 'rounded-lg';

  return (
    <span
      ref={ref}
      className={`relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden bg-primary/10 font-medium text-primary ${radius} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name}
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover ${imgClassName}`}
        />
      ) : (
        <span
          role="img"
          aria-label={name || undefined}
          className={fallbackClassName}
        >
          {initials}
        </span>
      )}
      {status && (
        <span
          aria-hidden="true"
          className={`absolute bottom-0 end-0 rounded-full ring-2 ring-surface ${
            statusSizes[size]
          } ${statusStyles[status] || statusStyles.offline}`}
        />
      )}
    </span>
  );
});

Avatar.displayName = 'Avatar';
