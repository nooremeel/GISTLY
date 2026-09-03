import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import type { Toast as ToastItem, ToastType } from '../context/ToastContext';
import { cx } from '../lib/cx';

type ToastConfig = {
  accent: string;
  label: string;
  live: 'polite' | 'assertive';
};

const TYPE_CONFIG: Record<ToastType, ToastConfig> = {
  success: {
    accent: 'border-l-lime',
    label: '✓',
    live: 'polite',
  },
  error: {
    accent: 'border-l-coral',
    label: '✕',
    live: 'assertive',
  },
  info: {
    accent: 'border-l-accent',
    label: 'ℹ',
    live: 'polite',
  },
};

/**
 * Individual animated toast item supporting click-to-dismiss and exit animations.
 */
function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const [dismissing, setDismissing] = useState(false);
  const config = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info;

  const handleDismiss = () => {
    if (dismissing) return;
    setDismissing(true);
    // Allow exit keyframe animation to complete before removing from state
    setTimeout(onRemove, 150);
  };

  // Trigger dismiss exit animation 150ms before context timeout removes item from state
  useEffect(() => {
    const timer = setTimeout(handleDismiss, Math.max(toast.duration - 150, 0));
    return () => clearTimeout(timer);
  }, [toast.duration]);

  return (
    <div
      role="status"
      aria-live={config.live}
      aria-atomic="true"
      onClick={handleDismiss}
      className={cx(
        'flex items-start gap-3 w-full max-w-sm cursor-pointer',
        'rounded-md border border-line border-l-4 bg-surface px-4 py-3',
        'shadow-md',
        config.accent,
        dismissing ? 'animate-toast-out' : 'animate-toast-in'
      )}
    >
      <span
        className="mt-0.5 shrink-0 text-small font-semibold text-muted select-none"
        aria-hidden="true"
      >
        {config.label}
      </span>

      <p className="text-body text-ink leading-snug">{toast.message}</p>
    </div>
  );
}

/**
 * Toast notifications container. Permanently mounted so the `aria-live` region
 * exists in the DOM prior to events, ensuring screen readers announce the initial toast.
 */
export default function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-[60] flex flex-col gap-2 items-end pointer-events-none"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto w-full max-w-sm">
          <ToastItem
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
