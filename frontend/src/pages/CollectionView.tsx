import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import BookmarkCard from '../components/BookmarkCard';
import EmptyState from '../components/EmptyState';
import ErrorCard from '../components/ErrorCard';
import BookmarkCardSkeleton from '../components/BookmarkCardSkeleton';
import type { Bookmark, CollectionGroup } from '../types/bookmark';
import { Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { AppShellContext } from '../components/AppShell';

export default function CollectionView() {
  const { name } = useParams<{ name: string }>();
  const [collection, setCollection] = useState<CollectionGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setIsSearchOpen } = useOutletContext<AppShellContext>();

  const fetchCollection = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await apiClient.get('/api/bookmarks/grouped')) as { data: CollectionGroup[] };
      const found = res.data.find((c) => c._id === name);
      setCollection(found || { _id: name!, count: 0, bookmarks: [] });
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
    setCollection((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        count: prev.count - 1,
        bookmarks: prev.bookmarks.filter((b) => b._id !== id),
      };
    });
  };

  const handleSaved = (updated: Bookmark) => {
    setCollection((prev) => {
      if (!prev) return prev;
      
      // If the user changed the collection to something else, remove it from this view
      if (updated.collection !== name) {
        return {
          ...prev,
          count: prev.count - 1,
          bookmarks: prev.bookmarks.filter((b) => b._id !== updated._id),
        };
      }
      
      // Otherwise update it in place
      return {
        ...prev,
        bookmarks: prev.bookmarks.map((b) => (b._id === updated._id ? updated : b)),
      };
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-20">
      <div>
        <h1 className="text-h2 font-semibold text-ink">
          {name}
        </h1>
        {/* Mobile Search Bar directly under heading */}
        <div className="md:hidden mt-4">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center w-full px-4 py-2.5 bg-surface border border-line rounded-md text-muted cursor-text"
          >
            <Search className="mr-2 size-5" />
            <span className="text-small">Search your library...</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div
          className="flex flex-col gap-4"
          aria-busy="true"
          aria-label="Loading your collection"
        >
          <BookmarkCardSkeleton />
        </div>
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchCollection} />
      ) : collection?.bookmarks.length === 0 ? (
        <EmptyState variant="collection" />
      ) : (
        <div className="flex flex-col gap-4">
          {collection?.bookmarks.map((bookmark) => (
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
