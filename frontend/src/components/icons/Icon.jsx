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