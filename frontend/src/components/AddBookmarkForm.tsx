import { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, X } from 'lucide-react';
import { apiClient, getImageUrl } from '../api/client';
import { useToast } from '../context/ToastContext';
import { Input } from './Input';
import { AutocompleteInput } from './AutocompleteInput';
import { Textarea } from './Textarea';
import { Button } from './Button';
import type { Bookmark } from '../types/bookmark';
import type { ProcessingBookmark } from './ProcessingCard';


import { getErrorStatus, getErrorMessage } from '../lib/errors';

const initialForm = {
  title: '',
  url: '',
  note: '',
  tags: [] as string[],
  collection: '',
  imageUrl: '',
};

export interface AddBookmarkFormProps {
  /** Immediate optimistic callback with provisional bookmark representation. */
  onProcessing?: (bookmark: ProcessingBookmark) => void;
  /** Invoked when backend returns persisted bookmark; carries _tempId for item replacement. */
  onCreated?: (bookmark: Bookmark & { _tempId: string; _animateGist: boolean }) => void;
  /** Invoked on creation failure to revert optimistic placeholder and restore form state. */
  onFailed?: (tempId: string) => void;
}

/**
 * Bookmark creation form supporting asynchronous page scraping and AI summarization
 * via optimistic UI updates and error-rollback recovery.
 */
export default function AddBookmarkForm({ onProcessing, onCreated, onFailed }: AddBookmarkFormProps) {
  const [form, setForm] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [fieldError, setFieldError] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCollections, setAvailableCollections] = useState<string[]>([]);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    apiClient.get('/api/bookmarks/tags').then((res: any) => {
      setAvailableTags(res.data.map((t: any) => t._id));
    }).catch(() => {});

    apiClient.get('/api/bookmarks/collections').then((res: any) => {
      setAvailableCollections(res.data.map((c: any) => c._id));
    }).catch(() => {});
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAutocompleteChange = (name: string, value: any) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const res: any = await apiClient.postFormData('/api/uploads', formData);
      setForm((prev) => ({ ...prev, imageUrl: res.url }));
      showToast('Image uploaded', 'success');
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to upload image'), 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Enforce invariant: either a URL or note must be populated before submission.
    if (!form.url.trim() && !form.note.trim()) {
      setFieldError(true);
      return;
    }
    setFieldError(false);

    const parsedTags = form.tags
      .map((t) => t.trim())
      .filter(Boolean);

    const tempId = crypto.randomUUID();

    let finalUrl = form.url.trim();
    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const processingBookmark: ProcessingBookmark = {
      _id: tempId,
      _processing: true,
      title: form.title.trim(),
      url: finalUrl || undefined,
      tags: parsedTags,
      collection: form.collection.trim() || 'Uncategorized',
      imageUrl: form.imageUrl || undefined,
      createdAt: new Date().toISOString(),
    };
    onProcessing?.(processingBookmark);

    // Snapshot current form values to allow state restoration if network request fails.
    const submittedForm = { ...form };
    setForm(initialForm);
    setIsLoading(true);

    try {
      const bookmark = (await apiClient.post('/api/bookmarks', {
        title: processingBookmark.title,
        url: finalUrl || undefined,
        note: submittedForm.note.trim(),
        collection: processingBookmark.collection,
        tags: parsedTags,
        imageUrl: submittedForm.imageUrl || undefined,
      })) as Bookmark;

      onCreated?.({ ...bookmark, _tempId: tempId, _animateGist: true });
      showToast('Bookmark added!', 'success');
    } catch (err) {
      onFailed?.(tempId);
      setForm(submittedForm);
      if (getErrorStatus(err) === 429) {
        showToast(
          "You've hit the hourly limit for adding bookmarks. Try again later.",
          'error'
        );
      } else {
        showToast(getErrorMessage(err, 'Failed to add bookmark. Draft restored.'), 'error');
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
        <p className="text-small text-faint text-center pt-2">
          — or fill in the details manually —
        </p>
      </div>

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

        <AutocompleteInput
          label="Tags"
          name="tags"
          id="tags"
          options={availableTags}
          multiple
          value={form.tags}
          onChange={(val) => handleAutocompleteChange('tags', val)}
          placeholder="design, frontend (press Enter)"
          disabled={isLoading}
        />

        <AutocompleteInput
          label="Collection"
          name="collection"
          id="collection"
          options={availableCollections}
          value={form.collection}
          onChange={(val) => handleAutocompleteChange('collection', val)}
          placeholder="Work, Personal, Reading List…"
          disabled={isLoading}
        />

        <div className="flex flex-col gap-2">
          <label className="text-small font-semibold text-ink">Cover Image (Optional)</label>
          <div className="flex gap-2">
            <Input
              name="imageUrl"
              placeholder="Paste image URL..."
              value={form.imageUrl}
              onChange={handleChange}
              disabled={isLoading || isUploading}
              wrapperClassName="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0 gap-2"
              onClick={() => fileInputRef.current?.click()}
              loading={isUploading}
              disabled={isLoading}
            >
              <ImageIcon className="size-4 text-muted" />
              Upload
            </Button>
          </div>
          {form.imageUrl && (
            <div className="relative inline-block w-max mt-2">
              <img 
                src={getImageUrl(form.imageUrl)} 
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
                onClick={() => setForm(prev => ({ ...prev, imageUrl: '' }))}
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
            disabled={isLoading || isUploading}
          />
        </div>
      </div>

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
