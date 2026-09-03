import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import SearchOverlay from './SearchOverlay';
import MobileTabBar from './MobileTabBar';
import AddBookmarkModal from './AddBookmarkModal';
import type { BookmarkListHandle } from './BookmarkList';

export type AppShellContext = {
  isMobileAddOpen: boolean;
  setIsMobileAddOpen: (v: boolean) => void;
  setIsSearchOpen: (v: boolean) => void;
  setIsAddOpen: (v: boolean) => void;
  /** Imperative handle allowing modals to mutate the active bookmark list without refetching. */
  bookmarkListRef: React.RefObject<BookmarkListHandle | null>;
};

export default function AppShell() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileAddOpen, setIsMobileAddOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const addButtonRef = useRef<HTMLButtonElement>(null);
  const bookmarkListRef = useRef<BookmarkListHandle>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col pb-[60px] md:pb-0">
      <Header
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAdd={() => setIsAddOpen(true)}
        addButtonRef={addButtonRef}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-8">
            <Outlet
              context={
                {
                  isMobileAddOpen,
                  setIsMobileAddOpen,
                  setIsSearchOpen,
                  setIsAddOpen,
                  bookmarkListRef,
                } satisfies AppShellContext
              }
            />
          </div>
        </main>
      </div>
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileTabBar onOpenAdd={() => setIsMobileAddOpen(true)} />

      {isAddOpen && (
        <AddBookmarkModal
          triggerRef={addButtonRef}
          onClose={() => setIsAddOpen(false)}
          onProcessing={(p) => bookmarkListRef.current?.addBookmark(p)}
          onCreated={(b) => {
            const { _tempId, ...realBookmark } = b;
            bookmarkListRef.current?.replaceBookmark(_tempId, realBookmark);
          }}
          onFailed={(tempId) => bookmarkListRef.current?.removeBookmark(tempId)}
        />
      )}
    </div>
  );
}