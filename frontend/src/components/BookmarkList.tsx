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

// ─── Types ────────────────────────────────────────────────────────────────────

/** Pagination envelope returned by `GET /api/bookmarks`. */
interface PaginatedResponse {
  data: Bookmark[];
  total: number;
  page: number;
  pages: number;
}

/** Composite bookmark item — either a real bookmark or a processing placeholder. */
type BookmarkItem = (Bookmark & { _processing?: false; _animateGist?: boolean }) | ProcessingBookmark;

/**
 * Imperative handle exposed via `ref` to parent components (currently `Home.tsx`).
 *
 * `addBookmark` and `replaceBookmark` let `AddBookmarkForm` splice the
 * processing placeholder + real bookmark directly into the list state without
 * a refetch — the no-refetch contract from `STATE.md` ("Key Architectural
 * Decisions"). Exported so `Home.tsx` can use it without re-declaring it.
 */
export interface BookmarkListHandle {
  addBookmark: (bookmark: ProcessingBookmark) => void;
  replaceBookmark: (tempId: string, real: Bookmark & { _animateGist?: boolean }) => void;
  /** Removes a ProcessingCard that failed to resolve (API error, rate limit, etc). */
  removeBookmark: (tempId: string) => void;
}

const LIMIT = 12;

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Bookmark list (design system / Task 10).
 *
 * Architecture note — search/filter data-flow bug (deferred to Task 11):
 *
 * The current implementation (and the old `.jsx` file) filters `bookmarks`
 * client-side after loading page 1 (12 items). This means:
 *   - Search only finds bookmarks in the currently loaded pages — not the
 *     user's full dataset.
 *   - Filtering tags only works across loaded items too.
 *
 * The correct fix is a `?search=` query param on `GET /api/bookmarks` (Task 11,
 * backend-only). Once Task 11 lands, `handleSearch` here will change from a
 * client-side `setSearchTerm` into a debounced API call that passes `search=`
 * to `fetchPage`, which resets to page 1 and replaces the list. The current
 * client-side filter is preserved in the meantime so the UI isn't broken.
 *
 * Tag filtering has the same problem, but `getByTag` endpoint already exists
 * (backend); Task 15 (Collections UI) will wire up proper tag filtering.
 *
 * For now: client-side filter is a known limitation, clearly noted here and
 * in `DESIGN_STATE.md`, not a bug introduced by this task.
 */
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

    /**
     * Ref to the "Load more" button — used to restore scroll position / focus
     * after a load-more appends items above the fold. Without this, appending
     * items shifts the viewport and the button disappears, leaving the user
     * stranded. We restore focus to the button so they can keep paginating.
     */
    const loadMoreRef = useRef<HTMLButtonElement>(null);

    // ─── Imperative handle ──────────────────────────────────────────────────
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

    // ─── Data fetching ──────────────────────────────────────────────────────
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

    // Initial load
    useEffect(() => {
      fetchPage(1, { append: false });
    }, [fetchPage]);

    const handleLoadMore = async () => {
      await fetchPage(page + 1, { append: true });
      // Restore focus to the load-more button after items are appended.
      loadMoreRef.current?.focus();
    };

    // ─── Client-side filter (Task 15 will replace tag filtering with server-side) ─────────
    const allTags = [
      ...new Set(
        bookmarks
          .filter((b): b is Bookmark => !('_processing' in b && b._processing))
          .flatMap((b) => (b as Bookmark).tags ?? [])
      ),
    ];

    const filteredBookmarks = bookmarks.filter((b) => {
      if ('_processing' in b && b._processing) return true; // always show

      const bm = b as Bookmark;
      const matchesTag = !activeTag || (bm.tags ?? []).includes(activeTag);
      return matchesTag;
    });

    // ─── Render ─────────────────────────────────────────────────────────────

    // The library is truly empty if there are no bookmarks and no active filter.
    const isTrulyEmpty = !loading && bookmarks.length === 0 && activeTag === null;

    // Initial load: we have no bookmarks yet and we are loading.
    const isInitialLoad = loading && bookmarks.length === 0;

    return (
      <div className="flex flex-col gap-6">
        {/* ── Toolbar: tag pills ─────────────────────────────── */}
        {/* We hide the toolbar ONLY if the user has 0 bookmarks total or if there's an error. */}
        {!isTrulyEmpty && !error && (
          <div className="flex flex-col gap-3">
            <TagPills
              tags={allTags}
              activeTag={activeTag}
              onSelectTag={setActiveTag}
            />
          </div>
        )}

        {/* ── Main Content Area ───────────────────────────────────────── */}
        {error ? (
          <ErrorCard message={error} onRetry={() => fetchPage(1, { append: false })} />
        ) : isTrulyEmpty ? (
          <EmptyState variant="library" onAdd={onAdd} />
        ) : isInitialLoad ? (
          // Initial load — skeleton cards
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
          // Search/filter load keeps the current list visible but dimmed
          <div
            className={cx(
              'flex flex-col gap-6 transition-opacity duration-200',
              loading ? 'opacity-50 pointer-events-none' : ''
            )}
          >
            {/* ── No results (tag filter returned nothing) ───────── */}
            {filteredBookmarks.length === 0 && (
              <EmptyState variant="tag" />
            )}

            {/* ── Bookmark cards ───────────────────────────────────────────── */}
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

            {/* ── Pagination: Load more ────────────────────────────────────── */}
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
