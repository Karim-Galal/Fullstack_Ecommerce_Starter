'use client';

import { Icon } from '@/components/icons';
import { IconButton } from '@/components/ui/actions';

const variantStyles = {
  default: 'bg-info/10 border-info/20 text-info',
  success: 'bg-success/10 border-success/20 text-success',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  destructive: 'bg-error/10 border-error/20 text-error',
  info: 'bg-info/10 border-info/20 text-info',
};

const iconMap = {
  default: 'info',
  success: 'success',
  warning: 'warning',
  destructive: 'error',
  info: 'info',
};

export function Alert({
  variant = 'default',
  title,
  description,
  children,
  className = '',
  dismissible = false,
  onDismiss,
  dismissLabel = 'Dismiss',
}) {
  return (
    <div
      className={`relative flex gap-3 rounded-lg border p-4 ${variantStyles[variant]} ${className}`}
      role="alert"
    >
      <div className="mt-0.5 flex-shrink-0" aria-hidden="true">
        <Icon name={iconMap[variant] || iconMap.default} size="md" />
      </div>
      <div className="min-w-0 flex-1">
        {title && <h4 className="font-medium">{title}</h4>}
        {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
        {children && <div className="mt-2">{children}</div>}
      </div>
      {dismissible && (
        <IconButton
          name="close"
          size="sm"
          onClick={onDismiss}
          label={dismissLabel}
          className="flex-shrink-0 opacity-50 hover:opacity-100"
        />
      )}
    </div>
  );
}

export { ToastProvider, useToast } from './feedback/ToastProvider';
export { Toast } from './feedback/Toast';
