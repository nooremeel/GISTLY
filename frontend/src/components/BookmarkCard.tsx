import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/cx';
import { Button } from './Button';
import { Tag } from './Tag';
import { Badge } from './Badge';
import Gist from './Gist';
import EditBookmarkModal from './EditBookmarkModal';
import type { Bookmark } from '../types/bookmark';

export interface BookmarkCardProps {
  bookmark: Bookmark;
  onUpdate: (updated: Bookmark) => void;
  onDelete: (deletedId: string) => void;
  /** When `true`, the Gist block enters with the fade+expand animation
   *  (Task 5's `animate-gist-enter`). Set by `BookmarkList` when it
   *  swaps a `ProcessingCard` for the real card — this is the moment
   *  the entrance animation is meant to fire (design system §11/§16). */
  animateGist?: boolean;
}

// Card shows at most this many tags before collapsing the rest into a
// "+N" overflow indicator (design system §12).
const MAX_VISIBLE_TAGS = 4;

/** Best-effort `https://example.com/path` -> `example.com`. Returns `null`
 * (rather than the raw string) on anything `URL` can't parse, so callers
 * can fall back to other text instead of showing a mangled domain. */
function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/** Compact relative-time label ("3m ago", "2d ago") for the card's
 * timestamp (design system §10). Returns '' for an unparseable date
 * rather than throwing, since a malformed timestamp shouldn't break the
 * whole card. */
function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const diffSec = Math.max(Math.round((Date.now() - then) / 1000), 0);
  if (diffSec < 60) return 'just now';

  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;

  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;

  return `${Math.round(diffMonth / 12)}y ago`;
}

/** `apiClient`'s `request()` throws a plain `Error` with a `.status`
 * property attached (see `api/client.js`) — but it's untyped JS, so under
 * `strict`'s `useUnknownInCatchVariables` the catch binding is `unknown`.
 * These two helpers narrow it back to the existing `err.status` /
 * `err.message` convention without introducing a new error shape. */
function getErrorStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * `useToast()` (`context/ToastContext.jsx`) is still untyped JS —
 * `createContext(null)` plus its `if (!ctx) throw ...; return ctx;` guard
 * makes TS narrow the return type to `never` for any consumer, which
 * breaks under `strict` the moment `showToast` is called. That's a
 * pre-existing gap in a file Task 9 ("Toast System Redesign") owns, not
 * something to fix here — this is a narrow, local cast scoped to this
 * file only, matching `showToast`'s actual runtime signature.
 */
type ShowToast = (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;

/**
 * Bookmark card (design system §10). The product's core surface — see
 * `gistly-design-system.md` §10/§11/§12 for the full spec this implements.
 *
 * The Gist block (§11) is rendered via the extracted `Gist` component
 * (Task 5). No `animate` prop is set here — summaries in the list are
 * already loaded, so they appear instantly. Task 7 (Bookmark Creation
 * Flow) will pass `animate` for freshly created bookmarks where the Gist
 * streams in after the processing state resolves.
 */
export default function BookmarkCard({ bookmark, onUpdate, onDelete, animateGist = false }: BookmarkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast() as { showToast: ShowToast };

  const handleDelete = async () => {
    if (!window.confirm('Delete this bookmark? This cannot be undone.')) return;

    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/bookmarks/${bookmark._id}`);
      showToast('Bookmark deleted', 'success');
      onDelete(bookmark._id);
    } catch (err) {
      const message =
        getErrorStatus(err) === 404 ? 'Already deleted' : getErrorMessage(err, 'Failed to delete bookmark');
      showToast(message, 'error');
      setIsDeleting(false);
    }
  };

  const domain = getDomain(bookmark.url);
  const hasTitle = Boolean(bookmark.title);
  // Domain gets its own metadata line only when it won't just duplicate
  // the headline below (i.e. there's a real title to show separately).
  const showDomainLine = hasTitle && Boolean(domain);
  const headline = bookmark.title || domain || bookmark.url || 'Untitled bookmark';

  const tags = bookmark.tags ?? [];
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = tags.length - visibleTags.length;

  const timestamp = formatRelativeTime(bookmark.createdAt);

  return (
    <article
      className={cx(
        'group relative rounded-lg border border-line bg-surface p-6 text-left',
        'transition-[transform,box-shadow,border-color] duration-200',
        'hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-sm',
        'motion-reduce:transition-none'
      )}
    >
      <div className={cx('flex items-start gap-2', showDomainLine ? 'justify-between' : 'justify-end')}>
        {showDomainLine && (
          <p className="min-w-0 truncate font-mono text-small text-muted">{domain}</p>
        )}

        {/* Hover/keyboard-focus-revealed actions, per §10's "hover-revealed
            rather than two permanently-visible buttons" guidance. Opacity
            (not display) so a tabbed-to button is still reachable, and
            group-focus-within keeps it visible for keyboard users who
            never trigger :hover. */}
        <div
          className={cx(
            'flex shrink-0 gap-1 opacity-0 transition-opacity duration-150',
            'group-hover:opacity-100 group-focus-within:opacity-100',
            'motion-reduce:transition-none'
          )}
        >
          <Button
            variant="ghost"
            size="compact"
            aria-label="Edit bookmark"
            disabled={isDeleting}
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button
            variant="destructive"
            size="compact"
            aria-label={isDeleting ? 'Deleting bookmark' : 'Delete bookmark'}
            aria-busy={isDeleting || undefined}
            disabled={isDeleting}
            onClick={handleDelete}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <h3 className="mt-1 text-h3 font-semibold text-ink">{headline}</h3>

      <Gist summary={bookmark.summary} animate={animateGist} />

      {bookmark.note && <p className="mt-4 text-body text-muted">{bookmark.note}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {visibleTags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {overflowCount > 0 && <Tag noPrefix>+{overflowCount}</Tag>}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {bookmark.collection && <Badge>{bookmark.collection}</Badge>}
          {timestamp && <span className="text-small text-faint">{timestamp}</span>}
        </div>
      </div>

      {isEditing && (
        <EditBookmarkModal
          bookmark={bookmark}
          onClose={() => setIsEditing(false)}
          onSaved={(updated: Bookmark) => {
            onUpdate(updated);
            setIsEditing(false);
          }}
        />
      )}
    </article>
  );
}
