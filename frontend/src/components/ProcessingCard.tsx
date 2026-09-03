import { Sparkles } from 'lucide-react';
import { getDomain } from '../lib/url';
import { Tag } from './Tag';
import { Badge } from './Badge';
import type { Bookmark } from '../types/bookmark';

/**
 * Optimistic bookmark representation awaiting backend AI generation and persistence.
 */
export type ProcessingBookmark = Pick<
  Bookmark,
  '_id' | 'title' | 'url' | 'tags' | 'collection' | 'createdAt' | 'imageUrl'
> & {
  _processing: true;
};

export interface ProcessingCardProps {
  bookmark: ProcessingBookmark;
}

/**
 * Optimistic card variant rendered while page scraping and AI summarization run.
 * Matches BookmarkCard geometry to prevent layout shift upon resolution.
 */
export default function ProcessingCard({ bookmark }: ProcessingCardProps) {
  const domain = getDomain(bookmark.url);
  const hasTitle = Boolean(bookmark.title);
  const showDomainLine = hasTitle && Boolean(domain);
  const headline = bookmark.title || domain || bookmark.url || 'Saving…';

  const tags = bookmark.tags ?? [];
  const visibleTags = tags.slice(0, 4);
  const overflowCount = tags.length - visibleTags.length;

  return (
    <article
      className="relative rounded-lg border border-line bg-surface p-6 text-left"
      aria-busy="true"
      aria-label={`Saving bookmark: ${headline}`}
    >
      {showDomainLine && (
        <p className="min-w-0 truncate font-mono text-small text-muted">
          {domain}
        </p>
      )}

      <h3 className="mt-1 text-h3 font-semibold text-ink">{headline}</h3>

      <div
        className="mt-4 rounded-md bg-lime-wash p-4"
        aria-label="Gist is being generated"
        role="status"
      >
        <div className="mb-2 flex items-center gap-2">
          <Sparkles
            className="size-3 text-accent animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span className="text-micro font-medium text-muted">
            Reading the page &amp; forming a gist…
          </span>
        </div>

        <div className="h-3 w-full rounded-sm animate-shimmer mb-2" aria-hidden="true" />
        <div className="h-3 w-4/5 rounded-sm animate-shimmer" aria-hidden="true" />
      </div>

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
