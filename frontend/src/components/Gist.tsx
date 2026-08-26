import { Sparkles } from 'lucide-react';
import { cx } from '../lib/cx';

export interface GistProps {
  /** The AI-generated summary text. When `null`, `undefined`, or an empty
   *  string, the component renders nothing — this is the AI fail-soft
   *  contract from `STATE.md` and must never be weakened. A card without
   *  a Gist should look like a quieter, still-complete card, not a broken
   *  one (design system §11). */
  summary: string | null | undefined;

  /** When `true`, the block enters with the fade + expand animation defined
   *  in `index.css` (`animate-gist-enter`, ~300ms, cubic-bezier(0.22, 1,
   *  0.36, 1), design system §11/§21). Set this for freshly created
   *  bookmarks where the Gist streams in after the processing state resolves;
   *  leave `false` (the default) for already-loaded summaries that should
   *  appear instantly.
   *
   *  `prefers-reduced-motion` is handled entirely in CSS: the
   *  `animate-gist-enter` class's animation is suppressed by the media query
   *  in `index.css`, so the block still appears (no state change is removed)
   *  but does so instantly — per §21's "instant state change rather than
   *  removing the state change altogether" requirement. No JS detection of
   *  motion preference is needed here. */
  animate?: boolean;

  /** Extra class names forwarded to the outer container — for one-off
   *  layout tweaks (margins, etc.) without needing new variant props. */
  className?: string;
}

/**
 * AI Gist block (design system §11). The product's signature element —
 * visually the most distinct thing on a bookmark card.
 *
 * Extracted from `BookmarkCard.tsx`'s inline block (Task 4) in Task 5.
 * `BookmarkCard` passes no `animate` prop for already-loaded summaries;
 * Task 7 (Bookmark Creation Flow) will pass `animate` for freshly
 * created bookmarks where the Gist appears after the processing state.
 */
export default function Gist({ summary, animate = false, className }: GistProps) {
  // Fail-soft contract: never render an empty or error state.
  // `summary: null` means the AI didn't run or failed quietly — that is
  // not an error condition and must not look like one (§11, §17).
  if (!summary) return null;

  return (
    <div
      className={cx(
        // Container: lime-wash background, radius-md
        // (background-wash treatment — see Task 4's decision log for the
        // wash-vs-left-border choice; revisit here if this pass finds the
        // left-border reads better once it's a standalone component).
        'rounded-md bg-lime-wash',
        // When not animating: standard mt-4 top margin + p-4 padding via Tailwind.
        // When animating: the keyframe animates padding-top/bottom from 0
        // to 1rem so the container expands naturally; the overflow: hidden
        // on animate-gist-enter clips content during the expand.
        'mt-4',
        animate ? 'animate-gist-enter' : 'p-4',
        className
      )}
    >
      {/* Label row: Sparkles icon + "GIST" in micro/uppercase/violet */}
      <div className="mb-1 flex items-center gap-1">
        <Sparkles
          className="size-3 text-accent"
          aria-hidden="true"
          // Decorative — the adjacent text "GIST" already names this block;
          // announcing both the icon's semantic meaning and the label would
          // be redundant (§22: no color-only signaling, but icon+text
          // together are not color-only — text carries the signal).
        />
        <span className="text-micro font-medium uppercase tracking-[0.06em] text-accent">
          Gist
        </span>
      </div>

      {/* Summary text: Body size, Ink color (not Muted — the Gist is a
          first-class statement, §11). */}
      <p className="text-body text-ink">{summary}</p>
    </div>
  );
}
