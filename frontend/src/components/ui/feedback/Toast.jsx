'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '../Button';

const variantConfig = {
  default: { icon: 'info', accent: 'text-info' },
  info: { icon: 'info', accent: 'text-info' },
  success: { icon: 'success', accent: 'text-success' },
  warning: { icon: 'warning', accent: 'text-warning' },
  destructive: { icon: 'error', accent: 'text-error' },
  error: { icon: 'error', accent: 'text-error' },
};

export function Toast({
  variant = 'default',
  title,
  description,
  action,
  duration = 5000,
  onClose,
  dismissLabel = 'Dismiss',
  className = '',
}) {
  const [visible, setVisible] = useState(true);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!duration || duration <= 0) return undefined;
    const timer = setTimeout(() => {
      setVisible(false);
      onCloseRef.current?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const config = variantConfig[variant] || variantConfig.default;

  const handleClose = () => {
    setVisible(false);
    onCloseRef.current?.();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto w-full overflow-hidden rounded-lg border border-border bg-surface-elevated p-4 shadow-lg animate-slide-in motion-reduce:animate-none ${className}`}
    >
      <div className="flex items-start gap-3">
        <Icon
          name={config.icon}
          size="md"
          className={`mt-0.5 flex-shrink-0 ${config.accent}`}
        />
        <div className="min-w-0 flex-1">
          {title && <p className="font-medium text-text-primary">{title}</p>}
          {description && (
            <p className="mt-1 text-sm text-text-secondary">{description}</p>
          )}
          {action && (
            <Button variant="ghost" size="sm" onClick={action.onClick} className="mt-2 -ms-2">
              {action.label}
            </Button>
          )}
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label={dismissLabel}
          className="-me-1 -mt-1 flex-shrink-0 rounded-lg p-1 text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Icon name="close" size="sm" />
        </button>
      </div>
    </div>
  );
}
