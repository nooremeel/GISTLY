import { useState } from 'react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Button } from './Button';
import type { Bookmark } from '../types/bookmark';
import type { ProcessingBookmark } from './ProcessingCard';


/** Extracts the error status from an unknown catch binding,
 *  matching the apiClient's `err.status` convention. */
function getErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const s = (err as { status?: unknown }).status;
    return typeof s === 'number' ? s : undefined;
  }
  return undefined;
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

const initialForm = {
  title: '',
  url: '',
  note: '',
  tags: '',
  collection: '',
};

export interface AddBookmarkFormProps {
  /**
   * Called *immediately* on submit (before the API call) with a
   * processing-shaped bookmark so the caller can prepend a
   * `<ProcessingCard>` to the list optimistically.
   */
  onProcessing?: (bookmark: ProcessingBookmark) => void;
  /**
   * Called when the API responds with the real `Bookmark` object.
   * The bookmark carries `_tempId` (so the caller can swap the
   * ProcessingCard) and `_animateGist` (so the real card plays
   * Task 5's Gist entrance animation on swap).
   */
  onCreated?: (bookmark: Bookmark & { _tempId: string; _animateGist: boolean }) => void;
}

/**
 * Bookmark creation form (design system §8 / Task 7). Rebuilt from raw
 * `<input>`/`<button>` elements to the Task 2 primitives.
 *
 * Creation flow:
 *   1. User submits → `onProcessing` fires with a temp bookmark →
 *      caller prepends a `<ProcessingCard>` to the list.
 *   2. API call runs (multi-second: page fetch + AI summary).
 *   3. API responds → `onCreated` fires with the real `Bookmark` +
 *      the temp ID → caller swaps ProcessingCard for a real
 *      `<BookmarkCard>` with `<Gist animate>` (Task 5's entrance anim).
 *
 * Functional contracts preserved:
 *   - Client-side "url or note required" guard runs before any API call.
 *   - `err.status === 429` → rate-limit toast (aiLimiter, per STATE.md).
 *   - No refetch — the in-place state update pattern is maintained.
 *   - `summary: null` is not an error; the real card just renders without
 *     a Gist block if the AI failed quietly.
 */
export default function AddBookmarkForm({ onProcessing, onCreated }: AddBookmarkFormProps) {
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldError, setFieldError] = useState(false);
  const { showToast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mirror the backend's "at least one of url/note" rule client-side.
    if (!form.url.trim() && !form.note.trim()) {
      setFieldError(true);
      return;
    }
    setFieldError(false);

    const parsedTags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const tempId = crypto.randomUUID();

    let finalUrl = form.url.trim();
    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    // Step 1 — optimistic: put a ProcessingCard in the list immediately.
    const processingBookmark: ProcessingBookmark = {
      _id: tempId,
      _processing: true,
      title: form.title.trim(),
      url: finalUrl || undefined,
      tags: parsedTags,
      collection: form.collection.trim() || 'Uncategorized',
      createdAt: new Date().toISOString(),
    };
    onProcessing?.(processingBookmark);

    // Clear the form right away — the card in the list is the feedback.
    setForm(initialForm);
    setIsLoading(true);

    // Step 2 — async: wait for the server + AI.
    try {
      const bookmark = (await apiClient.post('/api/bookmarks', {
        title: processingBookmark.title,
        url: finalUrl || undefined,
        note: form.note.trim(),   // note is in the payload but not in ProcessingCard
        collection: processingBookmark.collection,
        tags: parsedTags,
      })) as Bookmark;

      // Step 3 — swap: replace the ProcessingCard with the real card.
      // _animateGist: true tells BookmarkList to render the card with
      // <Gist animate> so Task 5's entrance animation plays.
      onCreated?.({ ...bookmark, _tempId: tempId, _animateGist: true });
      showToast('Bookmark added!', 'success');
    } catch (err) {
      // On API failure: remove the optimistic ProcessingCard by replacing
      // it with nothing — caller's replaceBookmark with null would work,
      // but the simplest approach is a toast + leave the card; the user
      // can delete it. Actually, cleaner: we signal failure by calling
      // onCreated with a "failed" bookmark — but that couples too much.
      // Decision: on failure, show a toast and leave the ProcessingCard
      // in the list. The user sees it's stuck and can delete it.
      // Task 14 (Error States) can revisit this with a proper error card.
      if (getErrorStatus(err) === 429) {
        showToast(
          "You've hit the hourly limit for adding bookmarks. Try again later.",
          'error'
        );
      } else {
        showToast(getErrorMessage(err, 'Failed to add bookmark.'), 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-6"
      aria-label="Add a bookmark"
      noValidate
    >
      {/*
        URL field — the primary action. Gets the lg size variant (Body
        Large, h-12) and a larger gap below it to visually separate it
        from the secondary fields. §8 explicitly calls this out: "the URL
        input gets slightly larger sizing — it's the primary action of
        that whole component."
      */}
      <div className="flex flex-col gap-2">
        <Input
          sizeVariant="lg"
          label="Paste a URL"
          name="url"
          id="bookmark-url"
          type="url"
          value={form.url}
          onChange={handleChange}
          placeholder="https://…"
          disabled={isLoading}
          autoComplete="off"
          spellCheck={false}
          error={fieldError ? 'Please provide a URL or a note.' : undefined}
        />
        {/*
          Thin visual separator between primary and secondary fields.
          Uses border-line token — same as card borders — so it sits
          quietly rather than competing with the content.
        */}
        <p className="text-small text-faint text-center pt-2">
          — or fill in the details manually —
        </p>
      </div>

      {/* Secondary fields — same gap-6 rhythm as each other */}
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          name="title"
          id="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          placeholder="Optional — leave blank to use the page title"
          disabled={isLoading}
        />

        <Textarea
          label="Note"
          name="note"
          id="note"
          value={form.note}
          onChange={handleChange}
          placeholder="Your own thoughts on why this is worth saving…"
          disabled={isLoading}
          error={fieldError ? 'Please provide a URL or a note.' : undefined}
        />

        <Input
          label="Tags"
          name="tags"
          id="tags"
          type="text"
          value={form.tags}
          onChange={handleChange}
          placeholder="design, frontend, reference  (comma-separated)"
          disabled={isLoading}
        />

        <Input
          label="Collection"
          name="collection"
          id="collection"
          type="text"
          value={form.collection}
          onChange={handleChange}
          placeholder="Work, Personal, Reading List…"
          disabled={isLoading}
        />
      </div>

      {/*
        Submit button — primary variant, full width. `loading` prop
        swaps the label for the pulsing Sparkles motif (§7/§16 —
        AI-forward loading, reserved for AI-triggering actions).
      */}
      <Button
        type="submit"
        variant="primary"
        loading={isLoading}
        className="w-full"
        aria-label={isLoading ? 'Adding bookmark and generating gist…' : undefined}
      >
        Add Bookmark
      </Button>
    </form>
  );
}
