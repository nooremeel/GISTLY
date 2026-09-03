/**
 * Joins truthy class name arguments into a single whitespace-delimited string.
 */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
