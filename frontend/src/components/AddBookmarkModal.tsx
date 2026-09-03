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
  /** Reference to trigger element for focus restoration on close. */
  triggerRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
}

/**
 * Modal dialog wrapping AddBookmarkForm in a portal overlay with
 * focus trapping, keyboard dismissal, and accessible ARIA attributes.
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

  const handleClose = useCallback(() => {
    triggerRef?.current?.focus();
    onClose();
  }, [triggerRef, onClose]);

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    mouseDownTarget.current = e.target;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Ignore backdrop click if drag originated inside modal content (e.g. text selection drag)
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      handleClose();
    }
  };

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

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    first?.focus();
  }, []);

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

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm animate-modal-scrim"
        aria-hidden="true"
      />

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
            'md:rounded-xl md:max-w-lg',
            'rounded-t-[20px] max-h-[90vh] flex flex-col overflow-hidden',
            'mt-auto md:mt-0 animate-sheet-enter md:animate-modal-panel',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="md:hidden w-12 h-1.5 bg-line rounded-full mx-auto mt-3 mb-1 shrink-0" />

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

          <div className="px-6 py-5 overflow-y-auto overscroll-contain custom-scrollbar flex-1">
            <AddBookmarkForm
              onProcessing={(p) => {
                onProcessing?.(p);
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
