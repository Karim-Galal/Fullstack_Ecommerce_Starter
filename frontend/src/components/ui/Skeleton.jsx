'use client';

export function Skeleton({ className = '', variant = 'text', width, height, count = 1, ...props }) {
  const items = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`
        animate-pulse rounded bg-neutral-200 dark:bg-neutral-700
        ${className}
      `}
      style={{ width, height }}
      {...props}
    />
  ));

  if (variant === 'circular') {
    return items.map((item, i) => (
      <div key={i} className="rounded-full" style={{ width, height }}>
        {item}
      </div>
    ));
  }

  if (variant === 'rectangular') {
    return items.map((item, i) => (
      <div key={i} className="rounded-lg" style={{ width, height }}>
        {item}
      </div>
    ));
  }

  return <div className="space-y-3">{items}</div>;
}

export function ProductCardSkeleton() {
  return (
    <article className="card group" variant="default" padding="none">
      <div className="aspect-square bg-neutral-200 dark:bg-neutral-700 animate-pulse" />
      <div className="p-4 space-y-3">
        <Skeleton variant="text" width="70%" height="1.25rem" count={2} />
        <Skeleton variant="text" width="40%" height="1.5rem" />
        <Skeleton variant="text" width="100%" height="2.5rem" />
      </div>
    </article>
  );
}

export function CardSkeleton({ lines = 3, className = '' }) {
  const widths = Array.from({ length: lines }, (_, i) => 60 + i * 10);

  return (
    <article className={`card ${className}`} variant="default" padding="md">
      <Skeleton variant="rectangular" width="100%" height="150px" />
      <div className="mt-4 space-y-3">
        {widths.map((width, i) => (
          <Skeleton key={i} variant="text" width={`${width}%`} />
        ))}
      </div>
    </article>
  );
}

export function PageSkeleton({ className = '' }) {
  return (
    <div className={`shell space-y-8 ${className}`}>
      <Skeleton variant="text" width="30%" height="2.5rem" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function LoadingSpinner({ size = 'md', className = '', 'aria-label': ariaLabel = 'Loading' }) {
  const sizeStyles = {
    xs: 'w-3 h-3 border-1.5',
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-2',
    xl: 'w-10 h-10 border-3',
  };

  return (
    <svg
      className={`${sizeStyles[size]} animate-spin text-primary ${className}`}
      viewBox="0 0 24 24"
      aria-label={ariaLabel}
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function LoadingOverlay({ className = '', message }) {
  return (
    <div className={`fixed inset-0 z-[var(--z-toast)] flex items-center justify-center bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm ${className}`}>
      <div className="flex flex-col items-center gap-4 p-6">
        <LoadingSpinner size="lg" />
        {message && <p className="text-text-secondary">{message}</p>}
      </div>
    </div>
  );
}