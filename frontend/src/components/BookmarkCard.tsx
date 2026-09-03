import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { apiClient, getImageUrl } from '../api/client';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/cx';
import { getErrorStatus, getErrorMessage } from '../lib/errors';
import { getDomain } from '../lib/url';
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
  /** Plays entrance animation on the Gist block when transitioning from a processing placeholder. */
  animateGist?: boolean;
}

const MAX_VISIBLE_TAGS = 4;

/** Formats timestamp as compact relative time ("3m ago", "2d ago"), returning empty string on invalid dates. */
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

/**
 * Core bookmark card presenting title, AI gist, cover preview, tags, and actions.
 */
export default function BookmarkCard({ bookmark, onUpdate, onDelete, animateGist = false }: BookmarkCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [imgError, setImgError] = useState(false);
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { showToast } = useToast();

  // Retains reference to trigger element for focus restoration upon modal dismissal.
  const editBtnRef = useRef<HTMLButtonElement>(null);

  const handleDelete = async () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      // Auto-revert confirmation prompt after 4 seconds of inactivity
      if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
      confirmTimeoutRef.current = setTimeout(() => setConfirmingDelete(false), 4000);
      return;
    }

    if (confirmTimeoutRef.current) clearTimeout(confirmTimeoutRef.current);
    setConfirmingDelete(false);
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
  // Display domain line only when it does not duplicate the headline
  const showDomainLine = hasTitle && Boolean(domain);
  const headline = bookmark.title || domain || bookmark.url || 'Untitled bookmark';

  const tags = bookmark.tags ?? [];
  const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
  const overflowCount = tags.length - visibleTags.length;

  const timestamp = formatRelativeTime(bookmark.createdAt);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-lg border border-line bg-surface p-4 md:p-6 text-left hover:border-accent/40 transition-colors duration-200"
      whileHover={{
        y: -6,
        scale: 1.02,
        boxShadow: '0 20px 32px -8px rgba(0, 0, 0, 0.12), 0 8px 12px -6px rgba(0, 0, 0, 0.06)',
      }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 280, damping: 18, mass: 0.6 }}
    >
      <div className={cx('flex items-start gap-2', showDomainLine ? 'justify-between' : 'justify-end')}>
        {showDomainLine && (
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate font-mono text-small text-muted hover:text-accent hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            {domain}
          </a>
        )}

        {/* Action buttons: visible on mobile, hover-revealed on desktop */}
        <div
          className={cx(
            'flex shrink-0 gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity duration-150',
          )}
        >
          <Button
            ref={editBtnRef}
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
            aria-label={
              confirmingDelete
                ? 'Confirm delete bookmark'
                : isDeleting
                  ? 'Deleting bookmark'
                  : 'Delete bookmark'
            }
            aria-busy={isDeleting || undefined}
            disabled={isDeleting}
            onClick={handleDelete}
            className={confirmingDelete ? 'bg-coral text-white font-medium px-2.5' : undefined}
          >
            {confirmingDelete ? (
              <span className="text-xs">Sure?</span>
            ) : (
              <Trash2 className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
      </div>

      <h3 className="mt-1 text-h3 font-semibold text-ink line-clamp-2">
        {bookmark.url ? (
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            {headline}
          </a>
        ) : (
          <span>{headline}</span>
        )}
      </h3>

      {bookmark.imageUrl && !imgError && (
        <div className="mt-4 mb-2 overflow-hidden rounded-md border border-line max-h-64 flex bg-paper">
          <img
            src={getImageUrl(bookmark.imageUrl)}
            alt="Cover"
            onError={() => setImgError(true)}
            className="w-full object-cover"
          />
        </div>
      )}

      <Gist summary={bookmark.summary} animate={animateGist} />

      {bookmark.note && <p className="mt-4 text-body text-muted">{bookmark.note}</p>}

      <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-2">
        <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-w-full">
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
          triggerRef={editBtnRef}
        />
      )}
    </motion.article>
  );
}
