'use client';

import { forwardRef } from 'react';

export const Card = forwardRef(
  ({ children, className = '', variant = 'default', padding = 'md', ...props }, ref) => {
    const variantStyles = {
      default: 'bg-surface border border-border',
      elevated: 'bg-surface-elevated shadow-md border-none',
      outlined: 'bg-surface border-2 border-border',
      ghost: 'bg-transparent border-none',
    };

    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6',
      xl: 'p-8',
    };

    return (
      <article
        ref={ref}
        className={`rounded-xl transition-shadow ${variantStyles[variant]} ${paddingStyles[padding]} ${className}`}
        {...props}
      >
        {children}
      </article>
    )
  }
);

Card.displayName = 'Card';

export const CardHeader = forwardRef(
  ({ children, className = '', ...props }, ref) => (
    <header ref={ref} className={`mb-4 ${className}`} {...props}>
      {children}
    </header>
  )
);

CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef(
  ({ children, className = '', ...props }, ref) => (
    <h3 ref={ref} className={`text-xl font-semibold text-text-primary ${className}`} {...props}>
      {children}
    </h3>
  )
);

CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef(
  ({ children, className = '', ...props }, ref) => (
    <p ref={ref} className={`text-text-secondary text-sm mt-1 ${className}`} {...props}>
      {children}
    </p>
  )
);

CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef(
  ({ children, className = '', ...props }, ref) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
);

CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef(
  ({ children, className = 'flex items-center gap-3 mt-4 pt-4 border-t border-border', ...props }, ref) => (
    <footer ref={ref} className={className} {...props}>
      {children}
    </footer>
  )
);

CardFooter.displayName = 'CardFooter';

