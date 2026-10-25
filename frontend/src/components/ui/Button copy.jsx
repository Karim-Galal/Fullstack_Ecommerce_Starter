'use client';

import { forwardRef } from 'react';
import { Icon } from '@/components/icons';

const variantStyles = {
  primary: 'bg-primary text-primary-on hover:bg-primary-hover',
  secondary: 'border border-border bg-surface-sunken text-text-primary hover:bg-surface-hover',
  outline: 'border border-border bg-transparent text-text-primary hover:bg-surface-hover',
  ghost: 'bg-transparent text-text-primary hover:bg-surface-hover',
  destructive: 'bg-error text-error-on hover:bg-error/90',
  link: 'bg-transparent text-primary underline-offset-4 hover:underline',
};

const sizeStyles = {
  xs: 'px-2.5 py-1.5 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-6 py-3 text-lg gap-2',
  xl: 'px-8 py-4 text-xl gap-3',
};

export const Button = forwardRef(
  ({ children, variant = 'primary', size = 'md', className = '', leftIcon, rightIcon, loading = false, disabled = false, type = 'button', ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={`inline-flex items-center justify-center font-semibold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <>
            {leftIcon && <Icon name={leftIcon} size="sm" aria-hidden="true" />}
            {children}
            {rightIcon && <Icon name={rightIcon} size="sm" aria-hidden="true" />}
          </>
        )}
      </button>
    )
  }
);

Button.displayName = 'Button';

export { ButtonGroup } from './actions/ButtonGroup';