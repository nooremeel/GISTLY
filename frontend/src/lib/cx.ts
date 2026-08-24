/**
 * Minimal className combinator. Filters out falsy values so conditional
 * classes can be written as `cx('base', isActive && 'active')` without
 * pulling in `clsx`/`cva` as a new dependency (none of Task 2's primitives
 * need more than this).
 */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
