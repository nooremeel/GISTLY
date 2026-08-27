import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import SearchOverlay from './SearchOverlay';
import MobileTabBar from './MobileTabBar';

export type AppShellContext = {
  isMobileAddOpen: boolean;
  setIsMobileAddOpen: (v: boolean) => void;
  setIsSearchOpen: (v: boolean) => void;
};

export default function AppShell() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileAddOpen, setIsMobileAddOpen] = useState(false);

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
      <Header onOpenSearch={() => setIsSearchOpen(true)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 md:py-8">
            <Outlet context={{ isMobileAddOpen, setIsMobileAddOpen, setIsSearchOpen } satisfies AppShellContext} />
          </div>
        </main>
      </div>
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <MobileTabBar onOpenAdd={() => setIsMobileAddOpen(true)} />
    </div>
  );
}