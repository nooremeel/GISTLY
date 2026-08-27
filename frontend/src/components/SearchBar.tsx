import { Search } from 'lucide-react';
import { Input } from './Input';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Forwarded to the underlying input's `id` — useful for external labels. */
  id?: string;
}

/**
 * Bookmark search field (design system §8 / Task 10).
 *
 * Uses Task 2's `Input` primitive with its `leadingIcon` prop — §8 carves
 * out a single exception to "no inline icon clutter" for the search field's
 * leading magnifier, which is the universal affordance for search inputs.
 *
 * `onChange` receives the raw string value (not a SyntheticEvent) so callers
 * don't need to do `e.target.value` extraction — simpler at the call site and
 * debounce-friendly (Task 11 will debounce the API call that this feeds into).
 *
 * Accessible: `Input` generates a stable `id` via `useId()` and pairs it with
 * a `<label>` when `label` is provided. We pass no `label` here because the
 * placeholder + `aria-label` are sufficient for a single-purpose search field
 * — an explicit label above the input would be redundant in the list header
 * context. §22: the `aria-label` on the underlying `<input>` (passed via
 * `...rest`) satisfies the "every input has an accessible name" requirement.
 */
export default function SearchBar({ value, onChange, id }: SearchBarProps) {
  return (
    <Input
      id={id}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search bookmarks…"
      aria-label="Search bookmarks"
      autoComplete="off"
      spellCheck={false}
      leadingIcon={<Search className="size-4" aria-hidden="true" />}
    />
  );
}
