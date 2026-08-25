import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { Button } from './Button';
import { Input } from './Input';
import AccountMenu from './AccountMenu';


export default function Header() {
  const scrollToAddForm = () => {
    document.getElementById('add-bookmark')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-line bg-surface px-6">
      <Link
        to="/"
        className="shrink-0 font-sans text-h3 font-semibold tracking-tight text-ink no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Gistly
      </Link>

      <div className="min-w-0 flex-1">
        <Input
          type="search"
          aria-label="Search bookmarks"
          placeholder="Search bookmarks... ⌘K"
          leadingIcon={<Search className="size-4" aria-hidden="true" />}
          disabled
          title="Search is coming soon"
          className="max-w-sm"
        />
      </div>

      <Button variant="primary" onClick={scrollToAddForm}>
        <Plus className="size-4" aria-hidden="true" />
        Add
      </Button>

      <AccountMenu />
    </header>
  );
}