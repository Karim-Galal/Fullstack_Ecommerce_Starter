'use client';

import { Button } from './Button';
import { Dialog } from './overlays/Dialog';

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className = '',
  showCloseButton = true,
  bodyClassName = '',
}) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      className={className}
      showCloseButton={showCloseButton}
      bodyClassName={bodyClassName}
    >
      {children}
    </Dialog>
  );
}

export function AlertDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  isLoading = false,
  variant = 'destructive',
}) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      showCloseButton={false}
      closeOnOverlay={!isLoading}
      closeOnEscape={!isLoading}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText || 'Cancel'}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={isLoading}>
            {confirmText}
          </Button>
        </div>
      }
    />
  );
}
