'use client';

import { Fragment, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon, IconButton } from '@/components/icons';
import { Button } from '@/components/ui/Button';

export function Modal({ isOpen, onClose, title, description, children, size = 'md', className = '', showCloseButton = true }) {
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const previousActiveElement = useRef(null);

  const trapFocus = (e) => {
    if (!contentRef.current) return;
    const focusableElements = contentRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      contentRef.current?.focus();

      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Tab') trapFocus(e);
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleKeyDown);
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  const modalContent = (
    <Fragment>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[var(--z-modal-backdrop)] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={contentRef}
          tabIndex={-1}
          className={`w-full ${sizeStyles[size]} bg-surface rounded-xl shadow-2xl transition-transform`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-5 border-b border-border">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-lg font-semibold text-text-primary">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-sm text-text-secondary">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <IconButton name="close" size="sm" onClick={onClose} aria-label="Close" className="text-text-tertiary hover:text-text-primary" />
              )}
            </div>
          )}
          <div className="p-5">{children}</div>
        </div>
      </div>
    </Fragment>
  );

  if (typeof window === 'undefined') return null;

  return createPortal(modalContent, document.body);
}

export function AlertDialog({ isOpen, onClose, title, description, confirmText, cancelText, onConfirm, isLoading = false, variant = 'destructive' }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description={description} size="sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-text-secondary">{description}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText || 'Cancel'}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={isLoading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}