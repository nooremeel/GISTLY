import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import BookmarkCard from '../components/BookmarkCard';
import EmptyState from '../components/EmptyState';
import ErrorCard from '../components/ErrorCard';
import BookmarkCardSkeleton from '../components/BookmarkCardSkeleton';
import type { Bookmark } from '../types/bookmark';
import { Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { AppShellContext } from '../components/AppShell';
import { usePageTitle } from '../lib/usePageTitle';

export default function CollectionView() {
  const { name } = useParams<{ name: string }>();
  usePageTitle(name ?? 'Collection');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setIsSearchOpen } = useOutletContext<AppShellContext>();

  const fetchCollection = async () => {
    if (!name) return;
    setLoading(true);
    setError(null);
    try {
      const res = (await apiClient.get(
        `/api/bookmarks?collection=${encodeURIComponent(name)}&limit=50`
      )) as { data: Bookmark[]; total: number };
      setBookmarks(res.data);
      setTotalCount(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollection();
  }, [name]);

  const handleDelete = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b._id !== id));
    setTotalCount((prev) => Math.max(prev - 1, 0));
  };

  const handleSaved = (updated: Bookmark) => {
    if (updated.collection !== name) {
      setBookmarks((prev) => prev.filter((b) => b._id !== updated._id));
      setTotalCount((prev) => Math.max(prev - 1, 0));
    } else {
      setBookmarks((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-20">
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-h2 font-semibold text-ink truncate">{name}</h1>
          {!loading && (
            <span className="text-small text-muted shrink-0 tabular-nums">
              {totalCount} {totalCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        <div className="md:hidden mt-4">
          <div
            role="button"
            tabIndex={0}
            aria-label="Search your library"
            onClick={() => setIsSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsSearchOpen(true);
              }
            }}
            className="flex items-center w-full px-4 py-2.5 bg-surface border border-line rounded-md text-muted cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Search className="mr-2 size-5" aria-hidden="true" />
            <span className="text-small">Search your library...</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div
          className="flex flex-col gap-6"
          aria-busy="true"
          aria-label="Loading your collection"
        >
          <BookmarkCardSkeleton />
          <BookmarkCardSkeleton />
          <BookmarkCardSkeleton />
        </div>
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchCollection} />
      ) : bookmarks.length === 0 ? (
        <EmptyState variant="collection" />
      ) : (
        <div className="flex flex-col gap-6">
          {bookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark._id}
              bookmark={bookmark}
              onDelete={() => handleDelete(bookmark._id)}
              onUpdate={handleSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
