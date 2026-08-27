import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import type { Toast as ToastItem, ToastType } from '../context/ToastContext';
import { cx } from '../lib/cx';

// ─── Per-type visual treatment (§19) ─────────────────────────────────────────
//
// §19 recommends "Ink background + left-accent-bar" as the preferred
// treatment over a full-saturation fill — better legibility and more
// restrained, consistent with the overall "chrome stays quiet" principle.
//
// Left-accent-bar = a 3px left border in the type colour; surface is always
// --color-surface so the text (always --color-ink) is guaranteed WCAG AA.
// The type colour appears only as the border (not as text or background),
// which sidesteps the Lime-on-light-surface contrast risk §22 flags.

type ToastConfig = {
  /** Left-border accent colour class */
  accent: string;
  /** Small type label shown before the message */
  label: string;
  /** aria-live value — errors are assertive, others polite (§22) */
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

// ─── Individual toast item ─────────────────────────────────────────────────────

/**
 * A single toast item. Mounts with the `animate-toast-in` entrance class
 * (slide from right + fade), then when `dismissing` is true, switches to
 * `animate-toast-out` (fade + slight scale-down) before the caller removes it.
 *
 * The dismissing → removal delay (150ms) matches `animate-toast-out`'s
 * duration so the exit animation fully plays before the DOM node disappears.
 */
function ToastItem({ toast, onRemove }: { toast: ToastItem; onRemove: () => void }) {
  const [dismissing, setDismissing] = useState(false);
  const config = TYPE_CONFIG[toast.type] ?? TYPE_CONFIG.info;

  const handleDismiss = () => {
    if (dismissing) return;
    setDismissing(true);
    // Wait for the exit animation to finish before removing from state.
    setTimeout(onRemove, 150);
  };

  // Auto-dismiss: when the context fires removeToast (via setTimeout in
  // showToast), the parent list re-renders without this item. But we want
  // the exit animation to play, so we intercept the removal by triggering
  // dismissing state slightly before the context's own timeout fires.
  // This is done by starting the dismiss animation 150ms before duration ends.
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
        // Layout + surface
        'flex items-start gap-3 w-full max-w-sm cursor-pointer',
        'rounded-md border border-line border-l-4 bg-surface px-4 py-3',
        'shadow-md',
        // Type-specific left accent bar
        config.accent,
        // Entrance / exit animation
        dismissing ? 'animate-toast-out' : 'animate-toast-in',
        // Transition on motion-reduce is handled in the CSS keyframes
      )}
    >
      {/* Type indicator glyph — small, muted, never the only signal (§22) */}
      <span
        className="mt-0.5 shrink-0 text-small font-semibold text-muted select-none"
        aria-hidden="true"
      >
        {config.label}
      </span>

      {/* Message */}
      <p className="text-body text-ink leading-snug">{toast.message}</p>
    </div>
  );
}

// ─── Toast region ──────────────────────────────────────────────────────────────

/**
 * Toast container (design system §19 / Task 9).
 *
 * Always mounted (even with zero toasts) so the `aria-live` region exists in
 * the DOM *before* the first announcement — screen readers only pick up
 * aria-live changes on elements that were already in the DOM when the
 * announcement fires. Rendering conditionally on `toasts.length > 0` would
 * miss the first toast.
 *
 * Position: top-right, 16px from edges (`top-4 right-4`), stacked with `gap-2`
 * per §19. z-index 60 sits above the modal scrim (z-50) so toasts remain
 * readable while a modal is open.
 */
export default function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div
      className="fixed top-4 right-4 z-[60] flex flex-col gap-2 items-end pointer-events-none"
      // aria-label gives the region a name for AT without duplicating content
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
