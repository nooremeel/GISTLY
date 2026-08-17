import { useState } from 'react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import EditBookmarkModal from './EditBookmarkModal';

export default function BookmarkCard({ bookmark, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (!window.confirm('Delete this bookmark? This cannot be undone.')) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/bookmarks/${bookmark._id}`);
      showToast('Bookmark deleted', 'success');
      onDelete(bookmark._id);
    } catch (err) {
      showToast(err.status === 404 ? 'Already deleted' : (err.message || 'Failed to delete bookmark'), 'error');
      setIsDeleting(false);
    }
  };

  return (
    <div className="bookmark-card">
      <h3>{bookmark.title || bookmark.url || 'Untitled bookmark'}</h3>
      {bookmark.title && bookmark.url && <p className="bookmark-url">{bookmark.url}</p>}
      {bookmark.note && <p className="bookmark-note">{bookmark.note}</p>}
      {bookmark.summary && <p className="bookmark-summary">{bookmark.summary}</p>}
      {bookmark.tags?.length > 0 && (
        <div className="bookmark-tags">
          {bookmark.tags.map((tag) => <span key={tag} className="bookmark-tag">{tag}</span>)}
        </div>
      )}
      <p className="bookmark-collection">{bookmark.collection}</p>

      <div className="bookmark-actions">
        <button onClick={() => setIsEditing(true)} disabled={isDeleting}>Edit</button>
        <button onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>

      {isEditing && (
        <EditBookmarkModal
          bookmark={bookmark}
          onClose={() => setIsEditing(false)}
          onSaved={(updated) => { onUpdate(updated); setIsEditing(false); }}
        />
      )}
    </div>
  );
}