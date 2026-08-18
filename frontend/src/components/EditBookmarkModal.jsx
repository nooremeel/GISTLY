import { useState } from 'react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function EditBookmarkModal({ bookmark, onClose, onSaved }) {
  const [title, setTitle] = useState(bookmark.title || '');
  const [url, setUrl] = useState(bookmark.url || '');
  const [note, setNote] = useState(bookmark.note || '');
  const [collection, setCollection] = useState(bookmark.collection || 'Uncategorized');
  const [tagsInput, setTagsInput] = useState((bookmark.tags || []).join(', '));
  const [saving, setSaving] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
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
      const updated = await apiClient.put(`/api/bookmarks/${bookmark._id}`, payload);
      showToast('Bookmark updated', 'success');
      onSaved(updated); // parent (BookmarkList) splices this into state
    } catch (err) {
      showToast(err.status === 404 ? 'This bookmark no longer exists' : (err.message || 'Failed to update bookmark'), 'error');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Edit Bookmark</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="url">URL</label>
            <input id="url" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="note">Note</label>
            <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="collection">Collection</label>
            <input id="collection" value={collection} onChange={(e) => setCollection(e.target.value)} />
          </div>
          <div className="form-field">
            <label htmlFor="tags">Tags (comma seperated)</label>
            <input id="tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}