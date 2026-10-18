'use client';

import { Icon } from '@/components/icons';

const sizeStyles = {
  sm: { wrapper: 'py-8 px-4', icon: 'h-10 w-10', iconBox: 'h-14 w-14', title: 'text-base' },
  md: { wrapper: 'py-12 px-6', icon: 'h-12 w-12', iconBox: 'h-16 w-16', title: 'text-lg' },
  lg: { wrapper: 'py-16 px-8', icon: 'h-16 w-16', iconBox: 'h-20 w-20', title: 'text-xl' },
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  size = 'md',
  className = '',
  ...props
}) {
  const styles = sizeStyles[size] || sizeStyles.md;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${styles.wrapper} ${className}`}
      {...props}
    >
      {icon && (
        <div
          className={`mb-4 flex items-center justify-center rounded-full bg-surface-sunken text-text-tertiary ${styles.iconBox}`}
          aria-hidden="true"
        >
          <Icon name={icon} size="xl" />
        </div>
      )}
      {title && (
        <h3 className={`font-semibold text-text-primary ${styles.title}`}>{title}</h3>
      )}
      {description && (
        <p className="mt-2 max-w-sm text-sm text-text-secondary">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
