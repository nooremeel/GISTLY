import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode, Ref } from 'react';
import { cx } from '../lib/cx';

const base = [
  'inline-flex items-center gap-1',
  'text-small font-medium rounded-sm px-2 py-1',
  'border transition-colors duration-150 motion-reduce:transition-none',
].join(' ');

const restStyle = 'bg-surface text-muted border-line';
const activeStyle = 'bg-accent-subtle text-accent border-accent/40';

// Shared so a filter-pill (interactive) and a display-only tag (static)
// render pixel-identically apart from the element they mount as.
function tagClassName(active: boolean, interactive: boolean, className?: string) {
  return cx(
    base,
    active ? activeStyle : restStyle,
    interactive && 'cursor-pointer hover:border-accent/40',
    interactive &&
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper',
    className
  );
}

/** `#tagname` label formatting — auto-prepends `#` unless `noPrefix` is set
 * (used for the "+2" overflow indicator, which isn't itself a tag name). */
function TagLabel({ noPrefix, children }: { noPrefix?: boolean; children: ReactNode }) {
  if (noPrefix) return <>{children}</>;
  return (
    <>
      <span aria-hidden="true">#</span>
      {children}
    </>
  );
}

interface SharedTagProps {
  /** Filter-pill "active/selected" treatment — accent-subtle bg + accent
   * text/border (§12). Static display tags on a card should leave this
   * unset. */
  active?: boolean;
  /** Renders `children` as-is instead of prefixing with `#` — for the
   * "+2" overflow indicator, not a real tag name. */
  noPrefix?: boolean;
  children: ReactNode;
}

export interface StaticTagProps
  extends SharedTagProps,
    Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  onClick?: undefined;
}

export interface InteractiveTagProps
  extends SharedTagProps,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children' | 'onClick'> {
  onClick: NonNullable<ButtonHTMLAttributes<HTMLButtonElement>['onClick']>;
}

export type TagProps = StaticTagProps | InteractiveTagProps;

/**
 * Tag/pill primitive (design system §12). Renders as a `<span>` for static
 * display (bookmark card's tag row) or a `<button>` when given an `onClick`
 * (toolbar filter pills) — same visual treatment either way, so callers
 * don't need two components for what's one design element.
 */
export const Tag = forwardRef<HTMLSpanElement | HTMLButtonElement, TagProps>(function Tag(
  { active = false, noPrefix, children, className, ...rest },
  ref
) {
  if ('onClick' in rest && rest.onClick) {
    const { onClick, ...buttonRest } = rest as InteractiveTagProps;
    return (
      <button
        ref={ref as Ref<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={tagClassName(active, true, className)}
        {...buttonRest}
      >
        <TagLabel noPrefix={noPrefix}>{children}</TagLabel>
      </button>
    );
  }

  return (
    <span
      ref={ref as Ref<HTMLSpanElement>}
      className={tagClassName(active, false, className)}
      {...(rest as HTMLAttributes<HTMLSpanElement>)}
    >
      <TagLabel noPrefix={noPrefix}>{children}</TagLabel>
    </span>
  );
});
