import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';
import AddBookmarkForm from './AddBookmarkForm';
import type { AddBookmarkFormProps } from './AddBookmarkForm';

/** All focusable element types we trap Tab within (mirrors EditBookmarkModal). */
const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface AddBookmarkModalProps extends AddBookmarkFormProps {
  /**
   * A ref to the element that triggered the modal (the "Add" button in
   * `Header`). When provided, focus is returned to it on close — required
   * by §18 and §22 to complete the keyboard-navigation loop.
   */
  triggerRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

/**
 * Add-bookmark modal (design system §18 / §22).
 *
 * Composes `AddBookmarkForm` inside a portal-rendered centered panel.
 * All accessibility requirements mirror EditBookmarkModal exactly:
 *   - Focus moves to the first focusable field on open.
 *   - Tab/Shift+Tab are trapped within the panel while open.
 *   - Escape closes the modal from any focused element inside it.
 *   - Clicking the scrim closes the modal.
 *   - On close, focus returns to `triggerRef` (the "Add" button).
 *   - `role="dialog"`, `aria-modal="true"`, `aria-labelledby` wires the
 *     panel heading to assistive tech.
 *
 * Rendered via `ReactDOM.createPortal` to `document.body` so the overlay
 * sits above all stacking contexts (same reason as EditBookmarkModal).
 *
 * The form itself (`AddBookmarkForm`) is not modified — this wrapper only
 * concerns itself with the shell (scrim, panel, heading, close button,
 * keyboard/focus handling).
 */
export default function AddBookmarkModal({
  triggerRef,
  onClose,
  onProcessing,
  onCreated,
  onFailed,
}: AddBookmarkModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const mouseDownTarget = useRef<EventTarget | null>(null);

  /** Stable heading id for aria-labelledby. */
  const TITLE_ID = 'add-modal-title';

  // ─── Close + focus-return ──────────────────────────────────────────────────
  /**
   * Every close path (Escape, backdrop click, X button) goes through this so
   * focus always returns to the trigger — never leaves the user stranded
   * on <body>.
   */
  const handleClose = useCallback(() => {
    triggerRef?.current?.focus();
    onClose();
  }, [triggerRef, onClose]);

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    mouseDownTarget.current = e.target;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if both mousedown and mouseup (click) originated directly on the backdrop container,
    // preventing accidental closes when dragging text selections inside inputs.
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      handleClose();
    }
  };

  // ─── Accessibility: close on Escape ───────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // ─── Accessibility: focus first field on mount ─────────────────────────────
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    first?.focus();
  }, []);

  // ─── Accessibility: trap Tab within the panel ──────────────────────────────
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  // ─── Render (portalled to document.body) ──────────────────────────────────
  return createPortal(
    <>
      {/* Scrim — animated fade-in overlay with subtle backdrop blur */}
      <div
        className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm animate-modal-scrim"
        aria-hidden="true"
      />

      {/* Panel container — centered on desktop, sheet-from-bottom on mobile */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 flex-col"
        onMouseDown={handleBackdropMouseDown}
        onClick={handleBackdropClick}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          className={[
            'relative w-full bg-surface border border-line shadow-lg',
            /* Desktop: centered panel, max-w-lg gives room for the form fields */
            'md:rounded-xl md:max-w-lg',
            /* Mobile: bottom sheet — slides up, rounded top corners only */
            'rounded-t-[20px] max-h-[90vh] flex flex-col overflow-hidden',
            /* Desktop gets the scale-in modal animation; mobile keeps sheet-enter */
            'mt-auto md:mt-0 animate-sheet-enter md:animate-modal-panel',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle — purely visual */}
          <div className="md:hidden w-12 h-1.5 bg-line rounded-full mx-auto mt-3 mb-1 shrink-0" />

          {/* Panel header: title + close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0 bg-surface">
            <h2
              id={TITLE_ID}
              className="text-h3 font-semibold text-ink"
            >
              Add Bookmark
            </h2>
            <Button
              variant="ghost"
              size="compact"
              onClick={handleClose}
              aria-label="Close add bookmark dialog"
              className="!p-0 size-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-paper transition-colors"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          {/* Form body — scrollable independently so scrollbars don't encroach on header */}
          <div className="px-6 py-5 overflow-y-auto overscroll-contain custom-scrollbar flex-1">
            <AddBookmarkForm
              onProcessing={(p) => {
                onProcessing?.(p);
                // Close the modal immediately after submit so the user
                // can see the ProcessingCard appear in the list behind it.
                handleClose();
              }}
              onCreated={onCreated}
              onFailed={onFailed}
            />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
