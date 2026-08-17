import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import BookmarkCard from './BookmarkCard';

const LIMIT = 12;

export default function BookmarkList() {
  const [bookmarks, setBookmarks] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const { showToast } = useToast();

  const fetchPage = async (pageToFetch, { append }) => {
    append ? setLoadingMore(true) : setLoading(true);
    try {
      const res = await apiClient.get(`/api/bookmarks?page=${pageToFetch}&limit=${LIMIT}`);
      setBookmarks((prev) => (append ? [...prev, ...res.data] : res.data));
      setPage(res.page);
      setPages(res.pages);
    } catch (err) {
      showToast(err.message || 'Failed to load bookmarks', 'error');
    } finally {
      append ? setLoadingMore(false) : setLoading(false);
    }
  };

  const handleUpdate = (updatedBookmark) => {
    setBookmarks((prev) =>
      prev.map((b) => (b._id === updatedBookmark._id ? updatedBookmark : b))
    );
  };

  const handleDelete = (deletedId) => {
    setBookmarks((prev) => prev.filter((b) => b._id !== deletedId));
  };

  useEffect(() => {
    fetchPage(1, { append: false });
  }, []);

  const handleLoadMore = () => {
    fetchPage(page + 1, { append: true });
  };

  if (loading) return <p>Loading bookmarks...</p>;

  if (bookmarks.length === 0) {
    return <p>No bookmarks yet.</p>;
  }

  return (
    <div>
      <div className="bookmark-list">
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark._id} bookmark={bookmark} onUpdate={handleUpdate} onDelete={handleDelete}/>
        ))}
      </div>

      {page < pages && (
        <button onClick={handleLoadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
}