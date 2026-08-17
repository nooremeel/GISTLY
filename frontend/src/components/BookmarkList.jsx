import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import BookmarkCard from './BookmarkCard';
import SearchBar from './SearchBar';
import TagPills from './TagPills';

const LIMIT = 12;

const BookmarkList = forwardRef(function BookmarkList(props, ref) {
  const [bookmarks, setBookmarks] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const { showToast } = useToast();

  // Exposes an imperative API so AddBookmarkForm (Task 17), which is not a
  // direct child of this component, can prepend a newly created bookmark
  // without triggering a refetch — consistent with handleUpdate/handleDelete.
  useImperativeHandle(ref, () => ({
    addBookmark: (newBookmark) => {
      setBookmarks((prev) => [newBookmark, ...prev]);
    },
  }));

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

  const allTags = [...new Set(bookmarks.flatMap((b) => b.tags || []))];

  const filteredBookmarks = bookmarks.filter((b) => {
    const matchesTag = !activeTag || (b.tags || []).includes(activeTag);

    const haystack = `${b.title || ''} ${b.note || ''} ${b.url || ''}`.toLowerCase();
    const matchesSearch = !searchTerm || haystack.includes(searchTerm.toLowerCase());

    return matchesTag && matchesSearch;
  });

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
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <TagPills tags={allTags} activeTag={activeTag} onSelectTag={setActiveTag} />
      <div className="bookmark-list">
        {filteredBookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark._id} bookmark={bookmark} onUpdate={handleUpdate} onDelete={handleDelete} />
        ))}
      </div>

      {page < pages && (
        <button onClick={handleLoadMore} disabled={loadingMore}>
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </div>
  );
});

export default BookmarkList;