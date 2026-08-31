import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import type { Bookmark } from '../types/bookmark';


/** Narrows an unknown catch binding to the apiClient's `.status` number. */
function getErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status?: unknown }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

/** All focusable element types we trap Tab within. */
const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface EditBookmarkModalProps {
  bookmark: Bookmark;
  onClose: () => void;
  onSaved: (updated: Bookmark) => void;
  /**
   * A ref to the element that triggered the modal (the Edit button in
   * `BookmarkCard`). When provided, focus is returned to it on close —
   * required by §18 and §22 to complete the keyboard-navigation loop.
   */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Edit-bookmark modal (design system §18 / Task 8).
 *
 * Accessibility requirements implemented here (§18 / §22):
 *   - Focus moves to the first focusable field on open.
 *   - Tab/Shift+Tab are trapped within the panel while open.
 *   - Escape closes the modal from any focused element inside it.
 *   - Clicking the scrim closes the modal.
 *   - On close, focus returns to `triggerRef` (the Edit button that opened it).
 *   - `role="dialog"`, `aria-modal="true"`, `aria-labelledby` wires the
 *     panel heading to assistive tech so it's announced as a dialog.
 *
 * Functional contracts preserved (STATE.md §15 "must not break" list):
 *   - `err.status === 404` → "This bookmark no longer exists" toast.
 *   - `onSaved(updated)` — parent (BookmarkList via BookmarkCard) splices
 *     the updated bookmark into state; no refetch.
 *   - Saving is a non-AI action → plain disabled + text swap, NOT the
 *     pulsing Gist-mark `loading` prop (§16's explicit distinction).
 *
 * Rendered via `ReactDOM.createPortal` to `document.body` so the overlay
 * sits above the card's own stacking context. Bookmark cards use CSS
 * `transform` on hover which creates a containing block for fixed-position
 * children — portalling out is the correct fix, not z-index fighting.
 */
export default function EditBookmarkModal({
  bookmark,
  onClose,
  onSaved,
  triggerRef,
}: EditBookmarkModalProps) {
  const [title, setTitle] = useState(bookmark.title ?? '');
  const [url, setUrl] = useState(bookmark.url ?? '');
  const [note, setNote] = useState(bookmark.note ?? '');
  const [collection, setCollection] = useState(bookmark.collection ?? 'Uncategorized');
  const [tagsInput, setTagsInput] = useState((bookmark.tags ?? []).join(', '));
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState(false);

  const { showToast } = useToast();

  /** Ref for the panel <div> — used for both ARIA wiring and focus trap. */
  const panelRef = useRef<HTMLDivElement>(null);

  /** Stable heading id for aria-labelledby. */
  const TITLE_ID = 'edit-modal-title';

  // ─── Close + focus-return ─────────────────────────────────────────────────
  /**
   * Every close path (Escape, scrim click, Cancel button) calls this so
   * focus always returns to the trigger — never leaves the user stranded
   * on <body> (§18 / §22). Defined before useEffect callbacks that reference it.
   */
  const handleClose = () => {
    triggerRef?.current?.focus();
    onClose();
  };

  // ─── Accessibility: close on Escape ──────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  // ─── Accessibility: focus first field on mount ────────────────────────────
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const first = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    first?.focus();
  }, []);

  // ─── Accessibility: trap Tab within the panel ─────────────────────────────
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
        // Shift+Tab: if focus is on the first element, wrap to last.
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab: if focus is on the last element, wrap to first.
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, []);

  // ─── Form submit ──────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Mirror the backend's "at least one of url/note" rule client-side.
    if (!url.trim() && !note.trim()) {
      setFieldError(true);
      return;
    }
    setFieldError(false);

    setSaving(true);
    try {
      const payload = {
        title,
        url,
        note,
        collection,
        tags: tagsInput.split(',').map((t) => t.trim()).filter(Boolean),
      };
      const updated = (await apiClient.put(
        `/api/bookmarks/${bookmark._id}`,
        payload
      )) as Bookmark;
      showToast('Bookmark updated', 'success');
      onSaved(updated); // parent splices this into state — no refetch
      // Note: modal unmounts via onSaved → setIsEditing(false) in BookmarkCard,
      // so we don't call handleClose() here — the parent handles unmounting.
    } catch (err) {
      showToast(
        getErrorStatus(err) === 404
          ? 'This bookmark no longer exists'
          : 'Failed to update bookmark',
        'error'
      );
      setSaving(false); // only reset on error; on success the modal unmounts
    }
  };

  // ─── Render (portalled to document.body) ─────────────────────────────────
  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40 bg-ink/40 animate-modal-scrim"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 pb-0 flex-col">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={TITLE_ID}
          className={[
            'relative w-full bg-surface shadow-lg',
            'md:rounded-lg md:max-w-md',
            'rounded-t-lg max-h-[90vh] overflow-y-auto',
            'mt-auto md:mt-0 p-6 flex flex-col gap-6 border border-line',
            'animate-sheet-enter md:animate-modal-panel'
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="md:hidden w-12 h-1.5 bg-line rounded-full mx-auto mb-2 shrink-0" />
          <h3 id={TITLE_ID} className="text-h3 font-semibold text-ink">
            Edit Bookmark
          </h3>
        <form
          id="edit-bookmark-form"
          onSubmit={handleSubmit}
          className="w-full grid gap-x-4 gap-y-3"
          style={{ gridTemplateColumns: 'max-content 1fr' }}
          noValidate
          aria-label="Edit bookmark details"
        >
          <label
            htmlFor="edit-title"
            className="self-center text-right text-small font-semibold text-ink"
          >
            Title
          </label>
          <Input
            id="edit-title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Optional — leave blank to use the page title"
            disabled={saving}
          />

          <label
            htmlFor="edit-url"
            className="self-center text-right text-small font-semibold text-ink"
          >
            URL
          </label>
          <Input
            id="edit-url"
            name="url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            disabled={saving}
            autoComplete="off"
            spellCheck={false}
            error={fieldError ? 'Please provide a URL or a note.' : undefined}
          />

          {/* Textarea label: self-start + pt-2.5 aligns it with the field's
              top edge instead of centering it vertically across 3 rows,
              which would look disconnected from the content */}
          <label
            htmlFor="edit-note"
            className="self-start pt-2.5 text-right text-small font-semibold text-ink"
          >
            Note
          </label>
          <Textarea
            id="edit-note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Your own thoughts on why this is worth saving…"
            disabled={saving}
            error={fieldError ? 'Please provide a URL or a note.' : undefined}
          />

          <label
            htmlFor="edit-tags"
            className="self-center text-right text-small font-semibold text-ink"
          >
            Tags
          </label>
          <Input
            id="edit-tags"
            name="tags"
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="design, frontend  (comma-separated)"
            disabled={saving}
          />

          <label
            htmlFor="edit-collection"
            className="self-center text-right text-small font-semibold text-ink"
          >
            Collection
          </label>
          <Input
            id="edit-collection"
            name="collection"
            type="text"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            placeholder="Work, Personal, Reading List…"
            disabled={saving}
          />

          {/*
            Footer — right-aligned per §18 ("Footer actions: right-aligned,
            Secondary (Cancel) + Primary (Save)").

            Rendered inside the <form> to avoid a React synthetic event bug 
            where onSubmit fails to fire for submit buttons placed outside 
            portalled forms. `col-span-2` makes it span the full grid width.

            Saving is a non-AI action: plain disabled state + text swap per §16.
            The `loading` prop (Gist-mark pulse) is reserved for AI-triggering
            actions only (Add Bookmark). This is §16's explicit distinction.
          */}
          <div className="col-span-2 flex items-center justify-end gap-3 mt-2">
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </>,
    document.body
  );
}
