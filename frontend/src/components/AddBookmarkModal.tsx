import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';
import AddBookmarkForm from './AddBookmarkForm';
import type { AddBookmarkFormProps } from './AddBookmarkForm';
import { cx } from '../lib/cx';

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
 * - Smooth entrance and exit animations (slide-up on mobile, scale/fade on desktop)
 * - Interactive finger drag-to-dismiss handle and header on mobile
 * - Hardware/System back-button handling
 * - Accessible focus trap & Escape key dismiss
 */
export default function AddBookmarkModal({
  triggerRef,
  onClose,
  onProcessing,
  onCreated,
  onFailed,
}: AddBookmarkModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const mouseDownTarget = useRef<EventTarget | null>(null);

  // Animation states
  const [isMounted, setIsMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Drag-to-dismiss tracking for mobile sheet
  const isDragging = useRef(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const lastY = useRef(0);
  const lastTime = useRef(0);
  const velocityY = useRef(0);

  /** Stable heading id for aria-labelledby. */
  const TITLE_ID = 'add-modal-title';

  const handleClose = useCallback(() => {
    if (window.innerWidth >= 768) {
      triggerRef?.current?.focus();
    }
    onClose();
  }, [triggerRef, onClose]);

  // Trigger smooth exit animation before invoking handleClose
  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (panelRef.current) {
      if (window.innerWidth < 768) {
        panelRef.current.style.transition = 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)';
        panelRef.current.style.transform = 'translateY(100%)';
      } else {
        panelRef.current.style.transition = 'opacity 200ms ease-in, transform 200ms ease-in';
        panelRef.current.style.opacity = '0';
        panelRef.current.style.transform = 'scale(0.95)';
      }
    }

    if (scrimRef.current) {
      scrimRef.current.style.transition = 'opacity 250ms ease-out';
      scrimRef.current.style.opacity = '0';
    }

    setTimeout(() => {
      handleClose();
    }, 250);
  }, [handleClose, isClosing]);

  // Trigger entrance transition on next animation frame after mount
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setIsMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    mouseDownTarget.current = e.target;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) {
      requestClose();
    }
  };

  // Keyboard Escape dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        requestClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [requestClose]);

  // Initial focus placement (desktop only - avoids mobile keyboard/viewport shift & touch conflicts)
  useEffect(() => {
    if (window.innerWidth < 768) return;
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

  // ─── Gesture Drag Logic (Touches & Pointers) ───────────────────────────
  const startDrag = (clientY: number) => {
    if (window.innerWidth >= 768) return;
    isDragging.current = true;
    startY.current = clientY;
    currentY.current = 0;
    lastY.current = clientY;
    lastTime.current = Date.now();
    velocityY.current = 0;

    if (panelRef.current) {
      panelRef.current.style.transition = 'none';
    }
    if (scrimRef.current) {
      scrimRef.current.style.transition = 'none';
    }
  };

  const moveDrag = (clientY: number) => {
    if (!isDragging.current || !panelRef.current) return;
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocityY.current = (clientY - lastY.current) / dt;
    }
    lastY.current = clientY;
    lastTime.current = now;

    const deltaY = clientY - startY.current;
    if (deltaY > 0) {
      currentY.current = deltaY;
      panelRef.current.style.transform = `translateY(${deltaY}px)`;
      if (scrimRef.current) {
        const opacity = Math.max(0, 1 - deltaY / 400);
        scrimRef.current.style.opacity = `${opacity}`;
      }
    } else {
      currentY.current = 0;
      panelRef.current.style.transform = 'translateY(0)';
      if (scrimRef.current) {
        scrimRef.current.style.opacity = '1';
      }
    }
  };

  const endDrag = () => {
    if (!isDragging.current || !panelRef.current) return;
    isDragging.current = false;

    // Dismiss if dragged down more than 75px or flicked downward with velocity
    const shouldDismiss = currentY.current > 75 || (velocityY.current > 0.4 && currentY.current > 20);

    if (shouldDismiss) {
      setIsClosing(true);
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      panelRef.current.style.transition = 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)';
      panelRef.current.style.transform = 'translateY(100%)';
      if (scrimRef.current) {
        scrimRef.current.style.transition = 'opacity 250ms ease-out';
        scrimRef.current.style.opacity = '0';
      }
      setTimeout(() => {
        handleClose();
      }, 250);
    } else {
      // Snap back smoothly
      panelRef.current.style.transition = 'transform 250ms cubic-bezier(0.32, 0.72, 0, 1)';
      panelRef.current.style.transform = 'translateY(0)';
      if (scrimRef.current) {
        scrimRef.current.style.transition = 'opacity 250ms ease-out';
        scrimRef.current.style.opacity = '1';
      }
      setTimeout(() => {
        if (panelRef.current && !isDragging.current) {
          panelRef.current.style.transform = '';
          panelRef.current.style.transition = '';
        }
        if (scrimRef.current && !isDragging.current) {
          scrimRef.current.style.opacity = '';
          scrimRef.current.style.transition = '';
        }
      }, 250);
    }
  };

  // Touch Handlers for Mobile
  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    startDrag(e.touches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDragging.current) {
      if (e.cancelable) e.preventDefault();
      moveDrag(e.touches[0].clientY);
    }
  };

  const onTouchEnd = () => {
    endDrag();
  };

  // Pointer Handlers for Mouse / Device Emulation
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if ((e.target as HTMLElement).closest('button')) return;
    startDrag(e.clientY);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    moveDrag(e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    endDrag();
  };

  return createPortal(
    <>
      <div
        ref={scrimRef}
        className={cx(
          'fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm transition-opacity duration-250 ease-out',
          isMounted && !isClosing ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        aria-hidden="true"
      />

      <div
        className={cx(
          'fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 flex-col',
          isClosing && 'pointer-events-none'
        )}
        onMouseDown={handleBackdropMouseDown}
        onClick={handleBackdropClick}
      >
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          className={cx(
            'relative w-full bg-surface border border-line shadow-lg',
            'md:rounded-xl md:max-w-lg',
            'rounded-t-[24px] max-h-[85vh] md:max-h-[90vh] flex flex-col overflow-hidden',
            'mt-auto md:mt-0',
            'transition-all duration-300 ease-out',
            isMounted && !isClosing
              ? 'translate-y-0 opacity-100 md:scale-100'
              : 'translate-y-full md:translate-y-0 opacity-0 md:scale-95',
            isClosing && 'pointer-events-none'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Drag Section: Handle + Header Area */}
          <div
            className="select-none touch-none shrink-0 cursor-grab active:cursor-grabbing md:cursor-default"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onTouchCancel={onTouchEnd}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            {/* Upper Handle Bar */}
            <div
              className="md:hidden w-full pt-3.5 pb-1 flex items-center justify-center"
              aria-label="Drag down to close"
            >
              <div className="w-12 h-1.5 bg-line hover:bg-muted/40 rounded-full transition-colors" />
            </div>

            {/* Header with Title and Close Button */}
            <div className="flex items-center justify-between px-6 py-3.5 md:py-4 border-b border-line bg-surface">
              <h2
                id={TITLE_ID}
                className="text-h3 font-semibold text-ink"
              >
                Add Bookmark
              </h2>
              <Button
                variant="ghost"
                size="compact"
                onClick={requestClose}
                aria-label="Close add bookmark dialog"
                className="!p-0 size-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-paper transition-colors"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>

          {/* Scrollable Form Content */}
          <div className="px-6 py-5 overflow-y-auto overscroll-contain custom-scrollbar flex-1">
            <AddBookmarkForm
              onProcessing={(p) => {
                onProcessing?.(p);
                requestClose();
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
