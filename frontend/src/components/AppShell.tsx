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
  /**
   * Opens the desktop Add Bookmark modal. Passed through the outlet context
   * so child pages (Home) don't need to re-manage this state locally.
   */
  setIsAddOpen: (v: boolean) => void;
  /**
   * The BookmarkList imperative handle — exposed here so the Add modal
   * (rendered at AppShell level) can still call addBookmark / replaceBookmark
   * to splice optimistic placeholders into the list without a refetch.
   */
  bookmarkListRef: React.RefObject<BookmarkListHandle | null>;
};

export default function AppShell() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileAddOpen, setIsMobileAddOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  /** Ref forwarded to the "Add" button in Header so focus returns after close. */
  const addButtonRef = useRef<HTMLButtonElement>(null);

  /**
   * The BookmarkList handle lives here (AppShell) rather than in Home,
   * because the AddBookmarkModal renders at AppShell level and needs access
   * to addBookmark / replaceBookmark. Home no longer manages this ref.
   */
  const bookmarkListRef = useRef<BookmarkListHandle>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command+K on Mac, Ctrl+K on Windows
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

      {/* Desktop Add Bookmark modal — portalled to document.body inside the
          component, rendered at AppShell level so it can access
          bookmarkListRef regardless of which child route is active. */}
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