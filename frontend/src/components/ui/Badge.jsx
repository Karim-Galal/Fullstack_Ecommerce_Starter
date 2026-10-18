'use client';

const variantStyles = {
  default: 'bg-surface-sunken text-text-secondary',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  destructive: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
  outline: 'bg-transparent border border-border text-text-secondary',
};

const sizeStyles = {
  xs: 'px-1.5 py-0.5 text-xs',
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
  lg: 'px-3 py-1 text-base',
};

export function Badge({ children, variant = 'default', size = 'md', className = '', dot = false, dotColor, ...props }) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: dotColor || 'currentColor' }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export { StatusBadge } from './data-display/StatusBadge';

export function PriceBadge({ price, currency = 'EGP', locale = 'en-EG', className = '', ...props }) {
  const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
  return <Badge variant="success" className={className} {...props}>{formatted}</Badge>;
}

export function DiscountBadge({ discount, className = '', ...props }) {
  return <Badge variant="warning" className={className} {...props}>{discount}% OFF</Badge>;
}