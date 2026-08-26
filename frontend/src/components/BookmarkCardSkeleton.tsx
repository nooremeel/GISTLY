/**
 * Skeleton card for the bookmark list's initial loading state (design
 * system §16 / Task 6). Renders 3 of these in place of the old
 * `<p>Loading bookmarks...</p>` while `BookmarkList` awaits its first
 * API response.
 *
 * Structural contract: same outer shell as `BookmarkCard` (`rounded-lg
 * border border-line bg-surface p-6`) so the list layout doesn't shift
 * when real cards replace skeletons. Placeholder bars are sized to
 * approximate — not exactly match — a typical card's content rows, so
 * the transition reads as "content loaded into slots that were already
 * reserved" rather than "layout rebuilt from scratch."
 *
 * Accessibility: `aria-hidden="true"` on every skeleton card (purely
 * decorative); the list wrapper in `BookmarkList` carries `aria-busy`
 * and `aria-label` so screen readers hear "Loading your bookmarks" once,
 * not a stream of meaningless skeleton cards.
 */

/** A single shimmer placeholder bar. Width/height are caller-supplied
 *  via className so the skeleton can vary bar sizes without new props. */
function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-sm animate-shimmer ${className ?? ''}`}
      aria-hidden="true"
    />
  );
}

export default function BookmarkCardSkeleton() {
  return (
    <div
      // Matches BookmarkCard's outer shell exactly — same rounded-lg,
      // border, surface bg, and p-6 padding.
      className="rounded-lg border border-line bg-surface p-6"
      aria-hidden="true"
    >
      {/* Row 1: domain-line width approximation */}
      <SkeletonBar className="h-3 w-1/4 mb-5" />

      {/* Row 2: title — two lines to approximate a wrapping H3 */}
      <SkeletonBar className="h-5 w-3/4 mb-2" />
      <SkeletonBar className="h-5 w-1/2 mb-6" />

      {/* Row 3: Gist block approximation — slightly taller, full width */}
      <div className="rounded-md bg-lime-wash p-4 mb-6">
        {/* Label row */}
        <SkeletonBar className="h-3 w-16 mb-3" />
        {/* Body lines */}
        <SkeletonBar className="h-4 w-full mb-2" />
        <SkeletonBar className="h-4 w-5/6" />
      </div>

      {/* Row 4: tag row + timestamp — bottom metadata line */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <SkeletonBar className="h-5 w-14 rounded-sm" />
          <SkeletonBar className="h-5 w-16 rounded-sm" />
          <SkeletonBar className="h-5 w-12 rounded-sm" />
        </div>
        <SkeletonBar className="h-3 w-10" />
      </div>
    </div>
  );
}
