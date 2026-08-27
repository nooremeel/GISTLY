import { cx } from '../lib/cx';

export interface TagPillsProps {
  tags: string[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

/**
 * Tag filter pills (design system §9 / Task 10).
 *
 * Redesigned from raw `<button style={...}>` to Tailwind token classes.
 * Each pill toggles its tag as the active filter; clicking an already-active
 * tag deselects it (sets active to null) — same toggle contract as before.
 *
 * Visual treatment (§9 "Tag / Badge"):
 *   - Inactive: `bg-accent-subtle` (low-opacity violet wash) + `text-accent`,
 *     `rounded-full`, `border border-line`
 *   - Active: `bg-ink text-paper` (high contrast, makes the selected tag
 *     unambiguous without relying on colour alone — §22)
 *   - Focus ring: same `focus-visible:ring-2 focus-visible:ring-accent` as
 *     Button primitive
 *   - `aria-pressed` on each pill so screen readers announce toggle state
 *
 * Renders nothing when there are no tags — same behavior as before.
 */
export default function TagPills({ tags, activeTag, onSelectTag }: TagPillsProps) {
  if (tags.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter by tag"
    >
      {tags.map((tag) => {
        const isActive = activeTag === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onSelectTag(isActive ? null : tag)}
            aria-pressed={isActive}
            className={cx(
              // Base — shared by active + inactive
              'inline-flex items-center gap-1',
              'rounded-full px-3 py-1',
              'text-small font-medium',
              'border transition-[background-color,color,border-color,box-shadow]',
              'duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              'focus-visible:ring-offset-1 focus-visible:ring-offset-paper',
              // State
              isActive
                ? 'bg-ink text-paper border-ink'
                : 'bg-accent-subtle text-accent border-line hover:border-accent hover:bg-accent-subtle/60'
            )}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
