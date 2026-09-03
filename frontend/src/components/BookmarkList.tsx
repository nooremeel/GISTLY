import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import BookmarkCard from './BookmarkCard';
import BookmarkCardSkeleton from './BookmarkCardSkeleton';
import ProcessingCard from './ProcessingCard';
import EmptyState from './EmptyState';
import ErrorCard from './ErrorCard';
import TagPills from './TagPills';
import { Button } from './Button';
import { cx } from '../lib/cx';
import type { Bookmark } from '../types/bookmark';
import type { ProcessingBookmark } from './ProcessingCard';

interface PaginatedResponse {
  data: Bookmark[];
  total: number;
  page: number;
  pages: number;
}

type BookmarkItem = (Bookmark & { _processing?: false; _animateGist?: boolean }) | ProcessingBookmark;

/**
 * Imperative handle allowing external controllers (modals, forms) to perform
 * optimistic insertions, updates, and rollbacks directly on the list state.
 */
export interface BookmarkListHandle {
  addBookmark: (bookmark: ProcessingBookmark) => void;
  replaceBookmark: (tempId: string, real: Bookmark & { _animateGist?: boolean }) => void;
  removeBookmark: (tempId: string) => void;
}

const LIMIT = 12;

const BookmarkList = forwardRef<BookmarkListHandle, { onAdd?: () => void }>(
  function BookmarkList({ onAdd }, ref) {
    const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const { showToast } = useToast();

    // Ref to the pagination trigger to restore focus after appending new page items.
    const loadMoreRef = useRef<HTMLButtonElement>(null);

    useImperativeHandle(ref, () => ({
      addBookmark: (newBookmark: ProcessingBookmark) => {
        setBookmarks((prev) => [newBookmark, ...prev]);
      },
      replaceBookmark: (tempId: string, real: Bookmark & { _animateGist?: boolean }) => {
        setBookmarks((prev) =>
          prev.map((b) =>
            b._id === tempId ? { ...real, _processing: false } : b
          )
        );
      },
      removeBookmark: (tempId: string) => {
        setBookmarks((prev) => prev.filter((b) => b._id !== tempId));
      },
    }));

    const fetchPage = useCallback(
      async (pageToFetch: number, { append }: { append: boolean }) => {
        append ? setLoadingMore(true) : setLoading(true);
        if (!append) setError(null);
        
        try {
          const res = (await apiClient.get(
            `/api/bookmarks?page=${pageToFetch}&limit=${LIMIT}`
          )) as PaginatedResponse;
          setBookmarks((prev) =>
            append ? [...prev, ...res.data] : res.data
          );
          setPage(res.page);
          setPages(res.pages);
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : 'Failed to load bookmarks';
          
          if (!append && pageToFetch === 1) {
            setError(msg);
          } else {
            showToast(msg, 'error');
          }
        } finally {
          append ? setLoadingMore(false) : setLoading(false);
        }
      },
      [showToast]
    );

    useEffect(() => {
      fetchPage(1, { append: false });
    }, [fetchPage]);

    const handleLoadMore = async () => {
      await fetchPage(page + 1, { append: true });
      loadMoreRef.current?.focus();
    };

    const allTags = [
      ...new Set(
        bookmarks
          .filter((b): b is Bookmark => !('_processing' in b && b._processing))
          .flatMap((b) => (b as Bookmark).tags ?? [])
      ),
    ];

    const filteredBookmarks = bookmarks.filter((b) => {
      if ('_processing' in b && b._processing) return true;

      const bm = b as Bookmark;
      const matchesTag = !activeTag || (bm.tags ?? []).includes(activeTag);
      return matchesTag;
    });

    // ─── Render ─────────────────────────────────────────────────────────────

    // Library is empty only when no bookmarks exist and no active filter is applied
    const isTrulyEmpty = !loading && bookmarks.length === 0 && activeTag === null;
    const isInitialLoad = loading && bookmarks.length === 0;

    return (
      <div className="flex flex-col gap-6">
        {!isTrulyEmpty && !error && (
          <div className="flex flex-col gap-3">
            <TagPills
              tags={allTags}
              activeTag={activeTag}
              onSelectTag={setActiveTag}
            />
          </div>
        )}

        {error ? (
          <ErrorCard message={error} onRetry={() => fetchPage(1, { append: false })} />
        ) : isTrulyEmpty ? (
          <EmptyState variant="library" onAdd={onAdd} />
        ) : isInitialLoad ? (
          <div
            className="flex flex-col gap-8"
            aria-busy="true"
            aria-label="Loading your bookmarks"
          >
            <BookmarkCardSkeleton />
            <BookmarkCardSkeleton />
            <BookmarkCardSkeleton />
          </div>
        ) : (
          <div
            className={cx(
              'flex flex-col gap-6 transition-opacity duration-200',
              loading ? 'opacity-50 pointer-events-none' : ''
            )}
          >
            {filteredBookmarks.length === 0 && (
              <EmptyState variant="tag" />
            )}

            {filteredBookmarks.length > 0 && (
              <div className="flex flex-col gap-8">
                {filteredBookmarks.map((bookmark) => {
                  if ('_processing' in bookmark && bookmark._processing) {
                    return <ProcessingCard key={bookmark._id} bookmark={bookmark} />;
                  }
                  const bm = bookmark as Bookmark & { _animateGist?: boolean };
                  return (
                    <BookmarkCard
                      key={bm._id}
                      bookmark={bm}
                      onUpdate={(updated) =>
                        setBookmarks((prev) =>
                          prev.map((b) => (b._id === updated._id ? updated : b))
                        )
                      }
                      onDelete={(deletedId) =>
                        setBookmarks((prev) => prev.filter((b) => b._id !== deletedId))
                      }
                      animateGist={bm._animateGist}
                    />
                  );
                })}
              </div>
            )}

            {page < pages && (
              <div className="flex justify-center pt-2">
                <Button
                  ref={loadMoreRef}
                  variant="secondary"
                  disabled={loadingMore}
                  onClick={handleLoadMore}
                >
                  {loadingMore ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export default BookmarkList;
