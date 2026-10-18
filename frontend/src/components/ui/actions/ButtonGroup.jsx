'use client';

import { forwardRef } from 'react';

const attachedStyles = {
  horizontal:
    '[&>*:not(:first-child)]:-ms-px [&>*:not(:first-child)]:rounded-s-none [&>*:not(:last-child)]:rounded-e-none',
  vertical:
    '[&>*:not(:first-child)]:-mt-px [&>*:not(:first-child)]:rounded-t-none [&>*:not(:last-child)]:rounded-b-none',
};

export const ButtonGroup = forwardRef(function ButtonGroup(
  { children, orientation = 'horizontal', attached = true, className = '', ...props },
  ref
) {
  const isVertical = orientation === 'vertical';

  return (
    <div
      ref={ref}
      role="group"
      data-orientation={orientation}
      className={`inline-flex ${isVertical ? 'flex-col' : 'flex-row'} ${
        attached ? attachedStyles[orientation] : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

ButtonGroup.displayName = 'ButtonGroup';
