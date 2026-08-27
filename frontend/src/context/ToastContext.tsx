import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';

// ─── Public types ─────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  /** Auto-dismiss after this many ms (default 3500). */
  duration: number;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: number) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

/**
 * Non-null typed default so `useToast()` returns `ToastContextValue` (not
 * `never`) under `strict` TS. The stub functions warn in dev if called outside
 * a provider — the same guard as the old `.jsx` file but without the
 * `createContext(null)` / `never`-narrowing problem.
 *
 * Background: `createContext(null)` + the old `.jsx`'s throw-guard meant TS
 * narrowed the only possible value (`null`) away, leaving consumers typed as
 * `never`. Every consumer in the app (BookmarkCard, AddBookmarkForm,
 * EditBookmarkModal) had to apply a local `as { showToast: ... }` cast to work
 * around this. This typed default fixes it at the source (Task 9's job per
 * DESIGN_STATE.md's "Open Questions" note).
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

// ─── Provider ─────────────────────────────────────────────────────────────────

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

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the toast context value. Typed as `ToastContextValue` (not `never`)
 * because the context uses a non-null default — no local cast needed in any
 * consumer (fixes the workaround in BookmarkCard/AddBookmarkForm/EditBookmarkModal).
 */
export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}
