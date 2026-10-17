'use client';

import { icons, iconProps, iconSizes } from './registry';

export function Icon({ name, size = 'md', className = '', 'aria-label': ariaLabel, ...props }) {
  const IconComponent = icons[name];

  if (!IconComponent) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Icon "${name}" not found in registry`);
    }
    return null;
  }

  const mergedProps = {
    ...iconProps,
    ...props,
    'aria-hidden': ariaLabel ? 'true' : 'false',
    'aria-label': ariaLabel,
    className: `${className}`,
    width: iconSizes[size] || iconSizes.md,
    height: iconSizes[size] || iconSizes.md,
  };

  return <IconComponent {...mergedProps} />;
}

export function IconButton({ name, size = 'md', children, className = '', onClick, ...props }) {
  const IconComponent = icons[name];

  if (!IconComponent) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`Icon "${name}" not found in registry`);
    }
    return null;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 p-2 rounded-lg transition-colors hover:bg-surface-hover focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${className}`}
      {...props}
    >
      <IconComponent
        width={iconSizes[size]}
        height={iconSizes[size]}
        aria-hidden="true"
      />
      {children}
    </button>
  );
}