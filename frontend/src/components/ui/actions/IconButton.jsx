'use client';

import { forwardRef } from 'react';
import { Icon } from '@/components/icons/Icon';

const variantStyles = {
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
  solid: 'bg-primary text-primary-on hover:bg-primary-hover',
  outline:
    'border border-border text-text-secondary hover:text-text-primary hover:bg-surface-hover',
  subtle: 'bg-primary/10 text-primary hover:bg-primary/20',
  danger: 'text-error hover:bg-error/10',
};

const sizeStyles = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const iconSizeMap = {
  xs: 'xs',
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

export const IconButton = forwardRef(function IconButton(
  {
    name,
    label,
    variant = 'ghost',
    size = 'md',
    loading = false,
    disabled = false,
    type = 'button',
    className = '',
    iconClassName = '',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;
  const accessibleLabel = label || props['aria-label'];

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-label={accessibleLabel}
      aria-busy={loading || undefined}
      className={`inline-flex flex-shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Icon
          name="loading"
          size={iconSizeMap[size]}
          className={`animate-spin motion-reduce:animate-none ${iconClassName}`}
        />
      ) : (
        <Icon name={name} size={iconSizeMap[size]} className={iconClassName} />
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';
