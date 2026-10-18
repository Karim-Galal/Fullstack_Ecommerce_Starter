'use client';

import { useRef } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../actions/IconButton';
import { useMounted, useOverlayBehavior } from './Dialog';

const widthStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full',
};

const heightStyles = {
  sm: 'max-h-64',
  md: 'max-h-96',
  lg: 'max-h-[32rem]',
  xl: 'max-h-[42rem]',
  full: 'max-h-full',
};

const sideToPlacement = {
  left: 'start',
  right: 'end',
  start: 'start',
  end: 'end',
  top: 'top',
  bottom: 'bottom',
};

export function Drawer({
  isOpen,
  onClose,
  side = 'end',
  size = 'md',
  title,
  description,
  children,
  footer,
  showCloseButton = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  closeLabel = 'Close',
  className = '',
  bodyClassName = '',
}) {
  const mounted = useMounted();
  const panelRef = useRef(null);

  useOverlayBehavior({
    isOpen: mounted && isOpen,
    onClose,
    closeOnEscape,
    containerRef: panelRef,
  });

  if (!mounted || !isOpen) return null;

  const placement = sideToPlacement[side] || 'end';
  const isVertical = placement === 'start' || placement === 'end';

  const positionStyles = {
    start: 'inset-y-0 start-0 h-full border-e border-border',
    end: 'inset-y-0 end-0 h-full border-s border-border',
    top: 'inset-x-0 top-0 w-full border-b border-border',
    bottom: 'inset-x-0 bottom-0 w-full border-t border-border',
  };

  const dimension = isVertical
    ? `w-full ${widthStyles[size] || widthStyles.md}`
    : `h-auto ${heightStyles[size] || heightStyles.md}`;

  const content = (
    <>
      <div
        className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/50 backdrop-blur-sm animate-fade-in motion-reduce:animate-none"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        aria-describedby={description ? 'drawer-description' : undefined}
        className={`fixed z-[var(--z-modal)] flex flex-col overflow-hidden bg-surface shadow-2xl outline-none ${positionStyles[placement]} ${dimension} ${className}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            {title && (
              <h2 id="drawer-title" className="text-lg font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {description && (
              <p id="drawer-description" className="mt-1 text-sm text-text-secondary">
                {description}
              </p>
            )}
          </div>
          {showCloseButton && (
            <IconButton
              name="close"
              size="sm"
              onClick={onClose}
              label={closeLabel}
              className="-me-1 -mt-1"
            />
          )}
        </div>
        <div className={`flex-1 overflow-y-auto p-5 ${bodyClassName}`}>{children}</div>
        {footer && <div className="border-t border-border p-5">{footer}</div>}
      </div>
    </>
  );

  return createPortal(content, document.body);
}
