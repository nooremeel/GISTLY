import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import AccountMenu from './AccountMenu';

export interface HeaderProps {
  onOpenSearch: () => void;
  onOpenAdd: () => void;
  /** Ref for focus restoration after modal dismissal. */
  addButtonRef?: React.Ref<HTMLButtonElement>;
}

/**
 * Sticky application header providing brand navigation, global search trigger,
 * bookmark creation modal trigger, and account menu.
 */
export default function Header({ onOpenSearch, onOpenAdd, addButtonRef }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between md:justify-start gap-4 border-b border-line bg-surface px-4 md:px-6">
      <Link
        to="/library"
        className="shrink-0 font-sans text-h3 font-semibold tracking-tight text-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Gistly
      </Link>

      <div className="min-w-0 flex-1 hidden md:block">
        <Input
          type="search"
          aria-label="Search bookmarks"
          placeholder="Search bookmarks... ⌘K"
          leadingIcon={<Search className="size-4" aria-hidden="true" />}
          className="max-w-sm cursor-text"
          readOnly
          onClick={onOpenSearch}
          onFocus={(e) => {
            e.target.blur();
            onOpenSearch();
          }}
        />
      </div>

      <div className="hidden md:block shrink-0">
        <Button
          ref={addButtonRef as React.Ref<HTMLButtonElement>}
          variant="primary"
          onClick={onOpenAdd}
          aria-label="Add bookmark"
        >
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>

      <div className="hidden md:block shrink-0">
        <AccountMenu />
      </div>
    </header>
  );
}