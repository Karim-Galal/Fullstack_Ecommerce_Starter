'use client';

const variantStyles = {
  default: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200',
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

export function StatusBadge({ status, className = '', ...props }) {
  const statusConfig = {
    pending: { label: 'Pending', variant: 'warning', dot: true, dotColor: '#f59e0b' },
    confirmed: { label: 'Confirmed', variant: 'info', dot: true, dotColor: '#3b82f6' },
    processing: { label: 'Processing', variant: 'info', dot: true, dotColor: '#3b82f6' },
    shipped: { label: 'Shipped', variant: 'primary', dot: true, dotColor: '#155e75' },
    delivered: { label: 'Delivered', variant: 'success', dot: true, dotColor: '#10b981' },
    cancelled: { label: 'Cancelled', variant: 'destructive', dot: true, dotColor: '#ef4444' },
    refunded: { label: 'Refunded', variant: 'destructive', dot: true, dotColor: '#ef4444' },
    approved: { label: 'Approved', variant: 'success', dot: true, dotColor: '#10b981' },
    rejected: { label: 'Rejected', variant: 'destructive', dot: true, dotColor: '#ef4444' },
    active: { label: 'Active', variant: 'success', dot: true, dotColor: '#10b981' },
    inactive: { label: 'Inactive', variant: 'default', dot: true, dotColor: '#64748b' },
    draft: { label: 'Draft', variant: 'default', dot: true, dotColor: '#64748b' },
    published: { label: 'Published', variant: 'success', dot: true, dotColor: '#10b981' },
    archived: { label: 'Archived', variant: 'default', dot: true, dotColor: '#64748b' },
  };

  const config = statusConfig[status] || { label: status, variant: 'default' };

  return <Badge variant={config.variant} dot={config.dot} dotColor={config.dotColor} className={className} {...props}>
    {config.label}
  </Badge>;
}

export function PriceBadge({ price, currency = 'EGP', locale = 'en-EG', className = '', ...props }) {
  const formatted = new Intl.NumberFormat(locale, { style: 'currency', currency }).format(price);
  return <Badge variant="success" className={className} {...props}>{formatted}</Badge>;
}

export function DiscountBadge({ discount, className = '', ...props }) {
  return <Badge variant="warning" className={className} {...props}>{discount}% OFF</Badge>;
}