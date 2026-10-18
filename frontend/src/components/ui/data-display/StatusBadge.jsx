'use client';

import { Badge } from '../Badge';

const statusConfig = {
  pending: { label: 'Pending', variant: 'warning', dotColor: 'var(--color-warning-500)' },
  confirmed: { label: 'Confirmed', variant: 'info', dotColor: 'var(--color-info-500)' },
  processing: { label: 'Processing', variant: 'info', dotColor: 'var(--color-info-500)' },
  shipped: { label: 'Shipped', variant: 'primary', dotColor: 'var(--color-brand-500)' },
  delivered: { label: 'Delivered', variant: 'success', dotColor: 'var(--color-success-500)' },
  cancelled: { label: 'Cancelled', variant: 'destructive', dotColor: 'var(--color-error-500)' },
  canceled: { label: 'Cancelled', variant: 'destructive', dotColor: 'var(--color-error-500)' },
  refunded: { label: 'Refunded', variant: 'destructive', dotColor: 'var(--color-error-500)' },
  failed: { label: 'Failed', variant: 'destructive', dotColor: 'var(--color-error-500)' },
  approved: { label: 'Approved', variant: 'success', dotColor: 'var(--color-success-500)' },
  rejected: { label: 'Rejected', variant: 'destructive', dotColor: 'var(--color-error-500)' },
  active: { label: 'Active', variant: 'success', dotColor: 'var(--color-success-500)' },
  inactive: { label: 'Inactive', variant: 'default', dotColor: 'var(--color-neutral-400)' },
  draft: { label: 'Draft', variant: 'default', dotColor: 'var(--color-neutral-400)' },
  published: { label: 'Published', variant: 'success', dotColor: 'var(--color-success-500)' },
  archived: { label: 'Archived', variant: 'default', dotColor: 'var(--color-neutral-400)' },
  paid: { label: 'Paid', variant: 'success', dotColor: 'var(--color-success-500)' },
  unpaid: { label: 'Unpaid', variant: 'warning', dotColor: 'var(--color-warning-500)' },
};

export function StatusBadge({
  status,
  label,
  labels,
  variant,
  size = 'md',
  dot = true,
  className = '',
  ...props
}) {
  const config = statusConfig[status] || { label: status, variant: 'default' };
  const resolvedLabel = label || (labels && labels[status]) || config.label;

  return (
    <Badge
      variant={variant || config.variant}
      size={size}
      dot={dot}
      dotColor={config.dotColor}
      className={className}
      {...props}
    >
      {resolvedLabel}
    </Badge>
  );
}

export { statusConfig };
