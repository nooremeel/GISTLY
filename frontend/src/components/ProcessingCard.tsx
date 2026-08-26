import { Sparkles } from 'lucide-react';
import { Tag } from './Tag';
import { Badge } from './Badge';
import type { Bookmark } from '../types/bookmark';

/**
 * The subset of `Bookmark` that's known at creation time — before the
 * server responds with a full record and before the AI has generated a
 * summary. `_id` is required as the stable React key. At least one of
 * `title`/`url` must be present (the backend enforces this), though both
 * are optional individually.
 */
export type ProcessingBookmark = Pick<
  Bookmark,
  '_id' | 'title' | 'url' | 'tags' | 'collection' | 'createdAt'
> & {
  /** Client-side only — never set by the server. Used by `BookmarkList`
   *  to distinguish this from a real `Bookmark` so it renders
   *  `<ProcessingCard>` instead of `<BookmarkCard>`. */
  _processing: true;
};

export interface ProcessingCardProps {
  /**
   * Partial bookmark data known at creation time. Task 7 (Bookmark
   * Creation Flow) constructs this from the form's submitted values
   * before the API response comes back, so it can render the card
   * immediately while the server + AI work in the background.
   */
  bookmark: ProcessingBookmark;
}

/** Best-effort domain extraction — same logic as `BookmarkCard.tsx`
 *  (duplicated intentionally rather than sharing, since `BookmarkCard`'s
 *  helper is a private module-level function, not a shared export; Task 10
 *  can decide if it's worth extracting to a shared util at that point). */
function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * "Processing" card variant (design system §16 / Task 6). Shown while
 * a newly submitted bookmark is being fetched + AI-analyzed server-side.
 *
 * Renders everything that's known immediately (title, domain, tags,
 * collection) and shows a branded pulsing placeholder where the Gist
 * will eventually appear. Task 7 (Bookmark Creation Flow) places this
 * into the list optimistically; once the server responds with the full
 * bookmark (including `summary`), Task 7 swaps it for a real
 * `<BookmarkCard animate>` — triggering `Gist.tsx`'s entrance animation.
 *
 * This is the "small transformation" moment §16 describes: shimmer/pulse
 * resolves into the real Gist via the entrance animation.
 */
export default function ProcessingCard({ bookmark }: ProcessingCardProps) {
  const domain = getDomain(bookmark.url);
  const hasTitle = Boolean(bookmark.title);
  const showDomainLine = hasTitle && Boolean(domain);
  const headline = bookmark.title || domain || bookmark.url || 'Saving…';

  const tags = bookmark.tags ?? [];
  // Show first 4 tags max — same cap as BookmarkCard.
  const visibleTags = tags.slice(0, 4);
  const overflowCount = tags.length - visibleTags.length;

  return (
    <article
      className="relative rounded-lg border border-line bg-surface p-6 text-left"
      // Signals to assistive tech that this card's content is still loading.
      // Screen readers will announce "Loading" + the card's accessible name
      // rather than treating it as a completed piece of content.
      aria-busy="true"
      aria-label={`Saving bookmark: ${headline}`}
    >
      {/* Domain line — only when there's a real title to show separately */}
      {showDomainLine && (
        <p className="min-w-0 truncate font-mono text-small text-muted">
          {domain}
        </p>
      )}

      <h3 className="mt-1 text-h3 font-semibold text-ink">{headline}</h3>

      {/* Gist placeholder — same container dimensions as the real Gist block
          so the card's height stays stable when the real Gist animates in. */}
      <div
        className="mt-4 rounded-md bg-lime-wash p-4"
        aria-label="Gist is being generated"
        // role="status" announces to screen readers that something is
        // happening here without being as intrusive as role="alert".
        role="status"
      >
        <div className="mb-2 flex items-center gap-2">
          {/* The pulsing Sparkles icon is the same Gist-mark motif used in
              Button's loading state (§7/§16) — reinforces the brand mark
              even in the waiting state. Reduced-motion: animate-none stops
              the pulse but the icon still renders. */}
          <Sparkles
            className="size-3 text-accent animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="text-micro font-medium text-muted">
            Reading the page &amp; forming a gist…
          </span>
        </div>

        {/* Two placeholder bars to hint at the incoming text content,
            using the same shimmer as BookmarkCardSkeleton. */}
        <div className="h-3 w-full rounded-sm animate-shimmer mb-2" aria-hidden="true" />
        <div className="h-3 w-4/5 rounded-sm animate-shimmer" aria-hidden="true" />
      </div>

      {/* Tags + collection — rendered for real if known (they are, since
          the user just typed them into the form). */}
      {(visibleTags.length > 0 || bookmark.collection) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {visibleTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
            {overflowCount > 0 && <Tag noPrefix>+{overflowCount}</Tag>}
          </div>

          {bookmark.collection && (
            <div className="flex shrink-0 items-center gap-3">
              <Badge>{bookmark.collection}</Badge>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
