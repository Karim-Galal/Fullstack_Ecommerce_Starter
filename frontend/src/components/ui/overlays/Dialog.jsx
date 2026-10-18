'use client';

import { useEffect, useId, useRef, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/icons';
import { IconButton } from '../actions/IconButton';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-4xl',
};

const emptySubscribe = () => () => {};

export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export function useOverlayBehavior({
  isOpen,
  onClose,
  closeOnEscape = true,
  containerRef,
  initialFocusRef,
}) {
  const previousActiveElement = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return undefined;

    previousActiveElement.current = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTarget = initialFocusRef?.current || containerRef?.current;
    focusTarget?.focus?.();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && closeOnEscape) {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab' || !containerRef?.current) return;

      const focusable = Array.from(
        containerRef.current.querySelectorAll(FOCUSABLE_SELECTOR)
      ).filter((element) => element.offsetParent !== null || element === document.activeElement);

      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, [isOpen, closeOnEscape, containerRef, initialFocusRef]);
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOverlay = true,
  closeOnEscape = true,
  closeLabel = 'Close',
  className = '',
  bodyClassName = '',
  headerClassName = '',
  ariaLabel,
  initialFocusRef,
}) {
  const mounted = useMounted();
  const contentRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();

  useOverlayBehavior({
    isOpen: mounted && isOpen,
    onClose,
    closeOnEscape,
    containerRef: contentRef,
    initialFocusRef,
  });

  if (!mounted || !isOpen) return null;

  const hasHeader = Boolean(title || description || showCloseButton || icon);

  const content = (
    <>
      <div
        className="fixed inset-0 z-[var(--z-modal-backdrop)] bg-black/50 backdrop-blur-sm animate-fade-in motion-reduce:animate-none"
        onClick={closeOnOverlay ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4">
        <div
          ref={contentRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={!title && ariaLabel ? ariaLabel : undefined}
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={description ? descriptionId : undefined}
          className={`flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden rounded-xl bg-surface shadow-2xl outline-none ${
            sizeStyles[size] || sizeStyles.md
          } ${className}`}
        >
          {hasHeader && (
            <div
              className={`flex items-start justify-between gap-4 border-b border-border p-5 ${headerClassName}`}
            >
              <div className="flex min-w-0 items-start gap-3">
                {icon && (
                  <span className="mt-0.5 flex-shrink-0 text-primary" aria-hidden="true">
                    <Icon name={icon} size="lg" />
                  </span>
                )}
                <div className="min-w-0">
                  {title && (
                    <h2 id={titleId} className="text-lg font-semibold text-text-primary">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p id={descriptionId} className="mt-1 text-sm text-text-secondary">
                      {description}
                    </p>
                  )}
                </div>
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
          )}
          <div className={`overflow-y-auto p-5 ${bodyClassName}`}>{children}</div>
          {footer && <div className="border-t border-border p-5">{footer}</div>}
        </div>
      </div>
    </>
  );

  return createPortal(content, document.body);
}
