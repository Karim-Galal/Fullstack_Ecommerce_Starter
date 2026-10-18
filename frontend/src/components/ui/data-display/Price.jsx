'use client';

const sizeStyles = {
  sm: { current: 'text-sm font-semibold', original: 'text-xs', badge: 'text-xs' },
  md: { current: 'text-base font-semibold', original: 'text-sm', badge: 'text-xs' },
  lg: { current: 'text-lg font-semibold', original: 'text-base', badge: 'text-sm' },
  xl: { current: 'text-2xl font-bold', original: 'text-lg', badge: 'text-sm' },
};

export function Price({
  value,
  currency = 'EGP',
  locale = 'en-EG',
  originalValue,
  discountPercent,
  size = 'md',
  showDiscount = false,
  className = '',
  ...props
}) {
  const amount = Number(value) || 0;
  const original = Number(originalValue) || 0;
  const hasOriginal = original > amount;
  const percent =
    discountPercent != null
      ? discountPercent
      : hasOriginal
        ? Math.round((1 - amount / original) * 100)
        : 0;

  const format = (input) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(input);

  const styles = sizeStyles[size] || sizeStyles.md;

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-2 ${className}`} {...props}>
      <span className={`${styles.current} text-text-primary`}>{format(amount)}</span>
      {hasOriginal && (
        <span className={`${styles.original} text-text-tertiary line-through`}>
          {format(original)}
        </span>
      )}
      {showDiscount && percent > 0 && (
        <span className={`${styles.badge} font-medium text-success`}>
          {`-${percent}%`}
        </span>
      )}
    </span>
  );
}
