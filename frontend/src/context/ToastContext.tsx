import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: number) => void;
}

/**
 * Initial fallback context value with development guard.
 * Provides explicit typing without null-narrowing to `never` in strict consumers.
 */
const stub = (): never => {
  if (import.meta.env.DEV) {
    throw new Error('useToast must be called inside <ToastProvider>');
  }
  return undefined as never;
};

const defaultValue: ToastContextValue = {
  toasts: [],
  showToast: stub,
  removeToast: stub,
};

const ToastContext = createContext<ToastContextValue>(defaultValue);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idCounter = useRef(0);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration = 3500) => {
      const id = idCounter.current++;
      setToasts((prev) => [...prev, { id, message, type, duration }]);
      setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
