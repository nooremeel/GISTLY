import { cx } from '../lib/cx';

export interface TagPillsProps {
  tags: string[];
  activeTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

/**
 * Interactive filter toolbar rendering selectable tag pills with toggle behavior.
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
              'inline-flex items-center gap-1',
              'rounded-full px-3 py-1',
              'text-small font-medium',
              'border transition-[background-color,color,border-color,box-shadow]',
              'duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              'focus-visible:ring-offset-1 focus-visible:ring-offset-paper',
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
