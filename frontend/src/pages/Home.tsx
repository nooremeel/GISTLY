import { useOutletContext } from 'react-router-dom';
import BookmarkList from '../components/BookmarkList';
import { Search } from 'lucide-react';
import { getGreeting } from '../lib/greeting';
import { usePageTitle } from '../lib/usePageTitle';
import type { AppShellContext } from '../components/AppShell';

export default function Home() {
  usePageTitle('Library');

  const {
    setIsSearchOpen,
    setIsAddOpen,
    bookmarkListRef,
  } = useOutletContext<AppShellContext>();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h1">{getGreeting()}.</h1>
        <div className="md:hidden mt-4">
          <div
            role="button"
            tabIndex={0}
            aria-label="Search your library"
            onClick={() => setIsSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsSearchOpen(true);
              }
            }}
            className="flex items-center w-full px-4 py-2.5 bg-surface border border-line rounded-md text-muted cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <Search className="mr-2 size-5" aria-hidden="true" />
            <span className="text-small">Search your library...</span>
          </div>
        </div>
      </div>

      <BookmarkList ref={bookmarkListRef} onAdd={() => setIsAddOpen(true)} />
    </div>
  );
}