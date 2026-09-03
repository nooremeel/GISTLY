import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import BookmarkCard from '../components/BookmarkCard';
import EmptyState from '../components/EmptyState';
import ErrorCard from '../components/ErrorCard';
import BookmarkCardSkeleton from '../components/BookmarkCardSkeleton';
import type { Bookmark } from '../types/bookmark';
import { Search, Hash } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { AppShellContext } from '../components/AppShell';
import { usePageTitle } from '../lib/usePageTitle';

export default function TagDetailView() {
  const { tag } = useParams<{ tag: string }>();
  usePageTitle(tag ? `#${tag}` : 'Tag');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setIsSearchOpen } = useOutletContext<AppShellContext>();

  const fetchBookmarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await apiClient.get(`/api/bookmarks/tags/${tag}`)) as { data: Bookmark[] };
      setBookmarks(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [tag]);

  const handleDelete = (id: string) => {
    setBookmarks((prev) => prev.filter((b) => b._id !== id));
  };

  const handleSaved = (updated: Bookmark) => {
    setBookmarks((prev) => {
      // If the user removed the tag, take it out of this view
      if (!updated.tags.includes(tag!)) {
        return prev.filter((b) => b._id !== updated._id);
      }
      return prev.map((b) => (b._id === updated._id ? updated : b));
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-20">
      <div>
        <div className="flex items-center gap-3">
          <Hash className="size-6 text-muted" />
          <h1 className="text-h2 font-semibold text-ink">
            {tag}
          </h1>
        </div>
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
          aria-label={`Loading bookmarks for ${tag}`}
        >
          <BookmarkCardSkeleton />
        </div>
      ) : error ? (
        <ErrorCard message={error} onRetry={fetchBookmarks} />
      ) : bookmarks.length === 0 ? (
        <EmptyState variant="search" />
      ) : (
        <div className="flex flex-col gap-4">
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
