'use client';

export function Skeleton({
  variant = 'text',
  width,
  height,
  count = 1,
  rounded,
  className = '',
  style,
  ...props
}) {
  const radius =
    rounded ||
    (variant === 'circular'
      ? 'rounded-full'
      : variant === 'rectangular'
        ? 'rounded-lg'
        : 'rounded');

  const items = Array.from({ length: Math.max(count, 1) }, (_, index) => (
    <div
      key={index}
      aria-hidden="true"
      className={`skeleton-shimmer motion-reduce:animate-none ${radius} ${className}`}
      style={{ width, height, ...style }}
      {...props}
    />
  ));

  if (items.length === 1) return items[0];

  return <div className="space-y-3">{items}</div>;
}

export function CardSkeleton({ lines = 3, className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-xl border border-border bg-surface p-5 ${className}`}
    >
      <Skeleton variant="rectangular" className="h-40 w-full" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton key={index} width={`${60 + index * 10}%`} className="h-4" />
        ))}
      </div>
    </div>
  );
}

export function LoadingSpinner({
  size = 'md',
  className = '',
  'aria-label': ariaLabel = 'Loading',
}) {
  const sizeStyles = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-10 h-10',
  };

  return (
    <svg
      className={`${sizeStyles[size] || sizeStyles.md} animate-spin text-primary motion-reduce:animate-none ${className}`}
      viewBox="0 0 24 24"
      role="status"
      aria-label={ariaLabel}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function LoadingOverlay({ className = '', message, label = 'Loading' }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-[var(--z-toast)] flex items-center justify-center bg-surface/80 backdrop-blur-sm ${className}`}
    >
      <div className="flex flex-col items-center gap-4 p-6">
        <LoadingSpinner size="lg" aria-label={label} />
        {message && <p className="text-text-secondary">{message}</p>}
      </div>
    </div>
  );
}

export { ProductCardSkeleton } from './skeletons/ProductCardSkeleton';
export { PageSkeleton } from './skeletons/PageSkeleton';
