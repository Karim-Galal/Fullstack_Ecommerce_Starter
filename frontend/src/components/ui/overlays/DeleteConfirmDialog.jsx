'use client';

import { ConfirmDialog } from './ConfirmDialog';

export function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  title = 'Delete item',
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
  className = '',
}) {
  const message =
    description ||
    (itemName
      ? `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
      : 'Are you sure you want to delete this item? This action cannot be undone.');

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={message}
      confirmText={confirmText}
      cancelText={cancelText}
      variant="destructive"
      icon="warning"
      isLoading={isLoading}
      className={className}
    />
  );
}
