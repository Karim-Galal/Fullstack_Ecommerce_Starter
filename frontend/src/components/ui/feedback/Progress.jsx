'use client';

const variantStyles = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
  info: 'bg-info',
};

const sizeStyles = {
  xs: 'h-1',
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export function Progress({
  value = 0,
  max = 100,
  variant = 'default',
  size = 'md',
  label,
  showValue = false,
  indeterminate = false,
  className = '',
  ...props
}) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(Number(value) || 0, 0), safeMax);
  const percent = (clamped / safeMax) * 100;

  return (
    <div className={className} {...props}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          {label && <span className="text-text-secondary">{label}</span>}
          {showValue && !indeterminate && (
            <span className="text-text-tertiary">{`${Math.round(percent)}%`}</span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={indeterminate ? undefined : clamped}
        aria-label={label}
        aria-busy={indeterminate || undefined}
        className={`w-full overflow-hidden rounded-full bg-surface-sunken ${sizeStyles[size] || sizeStyles.md}`}
      >
        {indeterminate ? (
          <div
            className={`h-full w-full animate-pulse motion-reduce:animate-none ${variantStyles[variant]}`}
          />
        ) : (
          <div
            className={`h-full rounded-full transition-[width] duration-300 ease-out ${variantStyles[variant]}`}
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
    </div>
  );
}
