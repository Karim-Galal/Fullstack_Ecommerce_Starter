'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Icon, IconButton } from '@/components/icons';
import { Button } from '@/components/ui/Button';

const variantStyles = {
  default: 'bg-info/10 border-info/20 text-info',
  success: 'bg-success/10 border-success/20 text-success',
  warning: 'bg-warning/10 border-warning/20 text-warning',
  destructive: 'bg-error/10 border-error/20 text-error',
  info: 'bg-info/10 border-info/20 text-info',
};

const iconMap = {
  default: 'info',
  success: 'checkCircle',
  warning: 'alertTriangle',
  destructive: 'alertCircle',
  info: 'info',
};

export function Alert({ variant = 'default', title, description, children, className = '', dismissible = false, onDismiss }) {
  return (
    <div
      className={`
        relative flex gap-3 p-4 rounded-lg border
        ${variantStyles[variant]}
        ${className}
      `}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5" aria-hidden="true">
        <Icon name={iconMap[variant]} size="md" />
      </div>
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-medium">{title}</h4>}
        {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
        {children && <div className="mt-2">{children}</div>}
      </div>
      {dismissible && (
        <IconButton
          name="close"
          size="sm"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="opacity-50 hover:opacity-100 flex-shrink-0"
        />
      )}
    </div>
  );
}

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(({ variant = 'default', title, description, action, duration = 5000 }) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, variant, title, description, action, duration }]);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            variant={t.variant}
            title={t.title}
            description={t.description}
            action={t.action}
            duration={t.duration}
            onClose={() => dismiss(t.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function Toast({ variant = 'default', title, description, action, onClose, duration = 5000 }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [visible, duration]);

  if (!visible) return null;

  return (
    <Alert
      variant={variant}
      title={title}
      description={description}
      dismissible
      onDismiss={onClose}
      className="fixed bottom-4 right-4 z-[var(--z-toast)] min-w-[300px] max-w-md shadow-xl animate-slide-in"
    >
      {action && (
        <Button variant="ghost" size="sm" onClick={action.onClick} className="mt-2">
          {action.label}
        </Button>
      )}
    </Alert>
  );
}