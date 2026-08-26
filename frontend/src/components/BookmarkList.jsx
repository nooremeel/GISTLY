import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import BookmarkCard from './BookmarkCard';
import BookmarkCardSkeleton from './BookmarkCardSkeleton';
import ProcessingCard from './ProcessingCard';
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

  // Exposes an imperative API so AddBookmarkForm, which is not a
  // direct child of this component, can manage bookmark state
  // without triggering a refetch — consistent with handleUpdate/handleDelete.
  useImperativeHandle(ref, () => ({
    // Prepend a new item (real or processing) to the list.
    addBookmark: (newBookmark) => {
      setBookmarks((prev) => [newBookmark, ...prev]);
    },
    // Swap a ProcessingCard (identified by tempId) for the real bookmark.
    // Called by AddBookmarkForm once the API responds.
    // If the real bookmark has summary: null, the ProcessingCard is still
    // replaced — the real card just renders without a Gist block
    // (AI fail-soft contract, STATE.md).
    replaceBookmark: (tempId, realBookmark) => {
      setBookmarks((prev) =>
        prev.map((b) => (b._id === tempId ? { ...realBookmark, _processing: false } : b))
      );
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

  // Initial load — show 3 skeleton cards instead of a bare loading text.
  // The container carries aria-busy + aria-label so screen readers hear
  // "Loading your bookmarks" once, rather than 3 meaningless skeleton
  // cards (each skeleton is aria-hidden individually — see BookmarkCardSkeleton).
  if (loading)
    return (
      <div
        className="flex flex-col gap-8"
        aria-busy="true"
        aria-label="Loading your bookmarks"
      >
        <BookmarkCardSkeleton />
        <BookmarkCardSkeleton />
        <BookmarkCardSkeleton />
      </div>
    );

  if (bookmarks.length === 0) {
    return <p>No bookmarks yet.</p>;
  }

  return (
    <div>
      <SearchBar value={searchTerm} onChange={setSearchTerm} />
      <TagPills tags={allTags} activeTag={activeTag} onSelectTag={setActiveTag} />
      <div className="bookmark-list">
        {!loading && bookmarks.length === 0 && (
          <div className="empty-state">
            <p>No bookmarks yet.</p>
            <p className="empty-state-sub">Add your first one using the form above.</p>
          </div>
        )}

        {!loading && bookmarks.length > 0 && filteredBookmarks.length === 0 && (
          <div className="empty-state">
            <p>No bookmarks match your search or filter.</p>
          </div>
        )}
        {filteredBookmarks.map((bookmark) => {
          // Processing items are added client-side by AddBookmarkForm before
          // the API responds. They carry _processing: true (never set by the
          // server) so we know to render ProcessingCard instead of BookmarkCard.
          if (bookmark._processing) {
            return <ProcessingCard key={bookmark._id} bookmark={bookmark} />;
          }
          return (
            <BookmarkCard
              key={bookmark._id}
              bookmark={bookmark}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              animateGist={bookmark._animateGist}
            />
          );
        })}
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