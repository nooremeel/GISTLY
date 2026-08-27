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
    /*
      Scrim — fixed-position, full-viewport ink overlay at ~45% opacity
      per §18. Clicking it closes the modal. The `animate-modal-scrim` class
      fades it in over 200ms (defined in index.css alongside gist/shimmer).

      aria-hidden="true" on the scrim wrapper prevents the background
      content from being re-announced while the dialog is open; ARIA dialog
      semantics live on the panel element instead.
    */
    <div
      className="animate-modal-scrim fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(23, 22, 26, 0.45)' }}
      onClick={handleClose}
      aria-hidden="true"
    >
      {/*
        Panel — the actual modal surface. `onClick` stops propagation so a
        click inside the panel doesn't bubble up to the scrim and close the
        modal unintentionally. `aria-hidden` is NOT set here — all ARIA
        dialog semantics live on this element.

        `animate-modal-panel` scales 0.96→1 + fades in over 200ms, per §18
        and §21's easing spec. Both animations defined in index.css.
      */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={TITLE_ID}
        className={[
          'animate-modal-panel',
          'relative w-full max-w-lg',
          'rounded-lg border border-line bg-surface',
          'p-6 shadow-lg',
          'flex flex-col gap-6',
        ].join(' ')}
        onClick={(e) => e.stopPropagation()}
        aria-hidden={undefined}
      >
        {/*
          Heading — tied to aria-labelledby so screen readers announce
          "Edit Bookmark, dialog" when the panel receives focus.
        */}
        <h3 id={TITLE_ID} className="text-h3 font-semibold text-ink">
          Edit Bookmark
        </h3>

        {/*
          Form fields — CSS grid layout (industry standard for edit panels):
          labels in col 1 (right-aligned, vertically aligned with each field),
          inputs in col 2. All inputs start at the exact same x-position
          regardless of label text length — the only layout that guarantees
          this. Labels are rendered explicitly in the grid (not via the `label`
          prop on Input/Textarea) so each label is a real grid cell; `htmlFor`
          keeps the label/field pairing intact for screen readers.
        */}
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
        </form>

        {/*
          Footer — right-aligned per §18 ("Footer actions: right-aligned,
          Secondary (Cancel) + Primary (Save)"). Both buttons associate with
          the form above via `form="edit-bookmark-form"`.

          Saving is a non-AI action: plain disabled state + text swap per §16.
          The `loading` prop (Gist-mark pulse) is reserved for AI-triggering
          actions only (Add Bookmark). This is §16's explicit distinction.
        */}
        <div className="flex items-center justify-end gap-3">
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
            form="edit-bookmark-form"
            variant="primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
