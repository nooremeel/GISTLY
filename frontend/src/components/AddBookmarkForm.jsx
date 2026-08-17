import { useState } from 'react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

const initialForm = {
  title: '',
  url: '',
  note: '',
  tags: '',
  collection: '',
};

export default function AddBookmarkForm({ onCreated }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { summary, tags } shown briefly after success
  const { showToast } = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mirror the backend's "at least one of url/note" rule client-side
    // to avoid a round-trip just to get a 400 back.
    if (!form.url.trim() && !form.note.trim()) {
      showToast('Please provide a URL or a note.', 'error');
      return;
    }

    const payload = {
      title: form.title.trim(),
      url: form.url.trim(),
      note: form.note.trim(),
      collection: form.collection.trim(),
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    };

    setLoading(true);
    setLastResult(null);

    try {
      // POST /api/bookmarks returns a flat, unwrapped bookmark object
      // (confirmed convention as of Task 16) — no { data } unwrapping needed.
      const bookmark = await apiClient.post('/api/bookmarks', payload);

      onCreated?.(bookmark);
      showToast('Bookmark added!', 'success');

      // Show the AI-generated summary/tags briefly before clearing the form,
      // so the user sees what was generated (Task 17 open question #1).
      setLastResult({ summary: bookmark.summary, tags: bookmark.tags || [] });
      setForm(initialForm);

      setTimeout(() => setLastResult(null), 4000);
    } catch (err) {
      if (err.status === 429) {
        showToast(
          "You've hit the hourly limit for adding bookmarks. Try again later.",
          'error'
        );
      } else {
        showToast(err.message || 'Failed to add bookmark.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-bookmark-form">
      <h2>Add Bookmark</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="title"
          placeholder="Title (optional)"
          value={form.title}
          onChange={handleChange}
          disabled={loading}
        />
        <input
          type="text"
          name="url"
          placeholder="URL"
          value={form.url}
          onChange={handleChange}
          disabled={loading}
        />
        <textarea
          name="note"
          placeholder="Note"
          value={form.note}
          onChange={handleChange}
          disabled={loading}
        />
        <input
          type="text"
          name="tags"
          placeholder="Tags (comma-separated)"
          value={form.tags}
          onChange={handleChange}
          disabled={loading}
        />
        <input
          type="text"
          name="collection"
          placeholder="Collection (optional)"
          value={form.collection}
          onChange={handleChange}
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Adding… (fetching page + generating summary)' : 'Add Bookmark'}
        </button>
      </form>

      {lastResult && (
        <div className="ai-result-preview">
          <p>
            <strong>AI Summary:</strong>{' '}
            {lastResult.summary || 'No summary generated.'}
          </p>
          {lastResult.tags.length > 0 && (
            <p>
              <strong>Tags:</strong> {lastResult.tags.join(', ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}