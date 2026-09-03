import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Image as ImageIcon, X } from 'lucide-react';
import { apiClient, getImageUrl } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Input } from './Input';
import { AutocompleteInput } from './AutocompleteInput';
import { Textarea } from './Textarea';
import { Button } from './Button';
import type { Bookmark } from '../types/bookmark';


import { getErrorStatus } from '../lib/errors';


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
  /** Reference to trigger element for focus restoration on close. */
  triggerRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Modal dialog for editing bookmark details.
 * Portalled to document.body to avoid containing-block trapping caused by
 * CSS transforms on animated parent cards.
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
  const [tagsInput, setTagsInput] = useState<string[]>(bookmark.tags ?? []);
  const [imageUrl, setImageUrl] = useState(bookmark.imageUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [fieldError, setFieldError] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiClient.get('/api/bookmarks/tags').then((res: any) => {
      setAvailableTags(res.data.map((t: any) => t._id));
    }).catch(() => {});

    apiClient.get('/api/bookmarks/collections').then((res: any) => {
      setAvailableCollections(res.data.map((c: any) => c._id));
    }).catch(() => {});
  }, []);

  const { showToast } = useToast();

  /** Ref for the panel <div> — used for both ARIA wiring and focus trap. */
  const panelRef = useRef<HTMLDivElement>(null);
  const mouseDownTarget = useRef<EventTarget | null>(null);

  /** Stable heading id for aria-labelledby. */
  const TITLE_ID = 'edit-modal-title';

  const handleClose = useCallback(() => {
    triggerRef?.current?.focus();
    onClose();
  }, [triggerRef, onClose]);

  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    mouseDownTarget.current = e.target;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const res: any = await apiClient.postFormData('/api/uploads', formData);
      setImageUrl(res.url);
      showToast('Image uploaded', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to upload image',
        'error'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Enforce invariant: either a URL or note must be provided.
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
        imageUrl: imageUrl || undefined,
        tags: tagsInput.map((t) => t.trim()).filter(Boolean),
      };
      const updated = (await apiClient.put(
        `/api/bookmarks/${bookmark._id}`,
        payload
      )) as Bookmark;
      showToast('Bookmark updated', 'success');
      onSaved(updated);
    } catch (err) {
      showToast(
        getErrorStatus(err) === 404
          ? 'This bookmark no longer exists'
          : 'Failed to update bookmark',
        'error'
      );
      setSaving(false);
    }
  };

  // ─── Render (portalled to document.body) ─────────────────────────────────
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
            'mt-auto md:mt-0 animate-sheet-enter md:animate-modal-panel'
          ].join(' ')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile drag handle */}
          <div className="md:hidden w-12 h-1.5 bg-line rounded-full mx-auto mt-3 mb-1 shrink-0" />

          {/* Header with Title & X close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-line shrink-0 bg-surface">
            <h3 id={TITLE_ID} className="text-h3 font-semibold text-ink">
              Edit Bookmark
            </h3>
            <Button
              variant="ghost"
              size="compact"
              onClick={handleClose}
              aria-label="Close edit bookmark dialog"
              className="!p-0 size-8 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-paper transition-colors"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <form
            id="edit-bookmark-form"
            onSubmit={handleSubmit}
            className="flex flex-col flex-1 overflow-hidden"
            noValidate
            aria-label="Edit bookmark details"
          >
            {/* Scrollable form body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar overscroll-contain">
              <div
                className="w-full grid gap-x-4 gap-y-3"
                style={{ gridTemplateColumns: 'max-content 1fr' }}
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
          <AutocompleteInput
            id="edit-tags"
            name="tags"
            options={availableTags}
            multiple
            value={tagsInput}
            onChange={setTagsInput}
            placeholder="design, frontend (press Enter)"
            disabled={saving}
          />

          <label
            htmlFor="edit-collection"
            className="self-center text-right text-small font-semibold text-ink"
          >
            Collection
          </label>
          <AutocompleteInput
            id="edit-collection"
            name="collection"
            options={availableCollections}
            value={collection}
            onChange={setCollection}
            placeholder="Work, Personal, Reading List…"
            disabled={saving}
          />

          <label className="self-start pt-2.5 text-right text-small font-semibold text-ink">
            Cover Image
          </label>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Input
                name="imageUrl"
                placeholder="Paste image URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                disabled={saving || isUploading}
                wrapperClassName="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 gap-2"
                onClick={() => fileInputRef.current?.click()}
                loading={isUploading}
                disabled={saving}
              >
                <ImageIcon className="size-4 text-muted" />
                Upload
              </Button>
            </div>
            {imageUrl && (
              <div className="relative inline-block w-max mt-2">
                <img 
                  src={getImageUrl(imageUrl)} 
                  alt="Cover preview" 
                  className="h-24 w-40 object-cover rounded-md border border-line"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = 'block';
                  }}
                />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 rounded-full bg-surface p-1 border border-line shadow-sm hover:bg-paper"
                  onClick={() => setImageUrl('')}
                  title="Remove image"
                >
                  <X className="size-3 text-muted" />
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              disabled={saving || isUploading}
            />
          </div>
        </div>
      </div>

      {/*
        Footer — pinned at bottom with border-t separator.
        Rendered inside <form> so submit works reliably.
      */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-line shrink-0 bg-surface">
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
