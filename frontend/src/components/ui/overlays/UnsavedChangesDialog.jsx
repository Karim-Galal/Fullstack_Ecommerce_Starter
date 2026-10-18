'use client';

import { Button } from '../Button';
import { Dialog } from './Dialog';

export function UnsavedChangesDialog({
  isOpen,
  onClose,
  onSave,
  onDiscard,
  onCancel,
  title = 'Unsaved changes',
  description = 'You have unsaved changes. Do you want to save them before leaving?',
  saveText = 'Save',
  discardText = 'Discard',
  cancelText = 'Cancel',
  isLoading = false,
  className = '',
}) {
  const handleCancel = onCancel || onClose || (() => {});

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleCancel}
      size="sm"
      icon="warning"
      title={title}
      description={description}
      showCloseButton={false}
      closeOnOverlay={!isLoading}
      closeOnEscape={!isLoading}
      className={className}
      footer={
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={handleCancel} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button variant="destructive" onClick={onDiscard} disabled={isLoading}>
            {discardText}
          </Button>
          <Button variant="primary" onClick={onSave} loading={isLoading}>
            {saveText}
          </Button>
        </div>
      }
    />
  );
}
