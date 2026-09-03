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

/** Formats tag label, auto-prefixing with `#` unless `noPrefix` is specified. */
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
  /** Highlights tag indicating active filter selection. */
  active?: boolean;
  /** Suppresses leading `#` prefix (e.g. for count indicators). */
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
 * Tag primitive supporting both static text display (`<span>`) and interactive filtering (`<button>`).
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

export default Tag;
