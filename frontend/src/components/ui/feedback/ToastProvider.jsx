'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Toast } from './Toast';

const ToastContext = createContext(null);

const positionStyles = {
  'top-left': 'top-4 start-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'top-right': 'top-4 end-4 items-end',
  'bottom-left': 'bottom-4 start-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 end-4 items-end',
};

let toastCounter = 0;

export function ToastProvider({ children, position = 'top-right', maxToasts = 5 }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback(
    (options) => {
      const base = typeof options === 'string' ? { description: options } : options || {};
      const id = ++toastCounter;
      const item = { variant: 'default', duration: 5000, ...base, id };
      setToasts((prev) => [...prev, item].slice(-maxToasts));
      return id;
    },
    [maxToasts]
  );

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clear = useCallback(() => setToasts([]), []);

  const value = useMemo(
    () => ({ toast, dismiss, clear, toasts }),
    [toast, dismiss, clear, toasts]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className={`pointer-events-none fixed z-[var(--z-toast)] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 ${
          positionStyles[position] || positionStyles['top-right']
        }`}
      >
        {toasts.map((item) => (
          <Toast key={item.id} {...item} onClose={() => dismiss(item.id)} />
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
