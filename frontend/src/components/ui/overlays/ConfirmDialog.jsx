'use client';

import { Button } from '../Button';
import { Dialog } from './Dialog';

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
  icon,
  closeOnOverlay = true,
  className = '',
}) {
  const body = description || message;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      icon={icon}
      title={title}
      showCloseButton={false}
      closeOnOverlay={closeOnOverlay && !isLoading}
      closeOnEscape={!isLoading}
      className={className}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={isLoading}>
            {confirmText}
          </Button>
        </div>
      }
    >
      {body && <p className="text-sm text-text-secondary">{body}</p>}
    </Dialog>
  );
}
