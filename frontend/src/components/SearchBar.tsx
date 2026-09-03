import { Search } from 'lucide-react';
import { Input } from './Input';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

/**
 * Accessible search input wrapper with leading magnifier icon and normalized value callback.
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
