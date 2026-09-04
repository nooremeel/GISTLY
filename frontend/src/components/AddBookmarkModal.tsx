import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';
import AddBookmarkForm from './AddBookmarkForm';
import type { AddBookmarkFormProps } from './AddBookmarkForm';

/** All focusable element types we trap Tab within. */
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
 * Modal dialog wrapping AddBookmarkForm in a portal overlay with:
 * - Mobile bottom sheet with interactive touch/pointer drag-to-dismiss handle
 * - Hardware/System back-button handling
 * - Accessible focus trap & Escape key dismiss
 * - Centered dialog layout on desktop
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

  // Drag-to-dismiss tracking for mobile sheet
  const isDragging = useRef(false);
  const startY = useRef(0);
  const currentY = useRef(0);

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
    // Ignore backdrop click if drag originated inside modal content
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      handleClose();
    }
  };

  // Keyboard Escape dismissal
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

  // Handle mobile device/system Back button navigation so it dismisses the sheet
  useEffect(() => {
    window.history.pushState({ gistlyModal: 'add-bookmark' }, '');

    const handlePopState = () => {
      handleClose();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (window.history.state?.gistlyModal === 'add-bookmark') {
        window.history.back();
      }
    };
  }, [handleClose]);

  // Initial focus placement
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    first?.focus();
  }, []);

  // Tab focus trap
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

  // Pointer drag gestures for mobile bottom sheet dismissal
  const handleDragStart = (e: React.PointerEvent) => {
    if (window.innerWidth >= 768) return;
    if ((e.target as HTMLElement).closest('button')) return;

    isDragging.current = true;
    startY.current = e.clientY;
    currentY.current = 0;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
    }
  };

  const handleDragMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !panelRef.current) return;
    const deltaY = e.clientY - startY.current;
    if (deltaY > 0) {
      currentY.current = deltaY;
      panelRef.current.style.transform = `translateY(${deltaY}px)`;
    } else {
      currentY.current = 0;
      panelRef.current.style.transform = 'translateY(0)';
    }
  };

  const handleDragEnd = (e: React.PointerEvent) => {
    if (!isDragging.current || !panelRef.current) return;
    isDragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    if (currentY.current > 80) {
      panelRef.current.style.transition = 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)';
      panelRef.current.style.transform = 'translateY(100%)';
      setTimeout(() => {
        handleClose();
      }, 200);
    } else {
      panelRef.current.style.transition = 'transform 200ms cubic-bezier(0.32, 0.72, 0, 1)';
      panelRef.current.style.transform = 'translateY(0)';
    }
  };

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
            'rounded-t-[24px] max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden',
            'mt-auto md:mt-0 animate-sheet-enter md:animate-modal-panel',
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Handle Area */}
          <div
            className="md:hidden w-full pt-3.5 pb-2 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            aria-label="Drag down to close"
          >
            <div className="w-12 h-1.5 bg-line hover:bg-muted/40 rounded-full transition-colors" />
          </div>

          {/* Sticky Header with Title and Close Button */}
          <div
            className="flex items-center justify-between px-6 py-3.5 md:py-4 border-b border-line shrink-0 bg-surface select-none md:cursor-default cursor-grab active:cursor-grabbing touch-none"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
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

          {/* Scrollable Form Content */}
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
