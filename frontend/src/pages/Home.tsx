import { useOutletContext } from 'react-router-dom';
import BookmarkList from '../components/BookmarkList';
import { Search } from 'lucide-react';
import { getGreeting } from '../lib/greeting';
import { usePageTitle } from '../lib/usePageTitle';

import type { AppShellContext } from '../components/AppShell';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import AddBookmarkForm from '../components/AddBookmarkForm';

export default function Home() {
  usePageTitle('Library');

  const {
    isMobileAddOpen,
    setIsMobileAddOpen,
    setIsSearchOpen,
    setIsAddOpen,
    bookmarkListRef,
  } = useOutletContext<AppShellContext>();
  const dragControls = useDragControls();

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

      <AnimatePresence>
        {isMobileAddOpen && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm"
            onClick={() => setIsMobileAddOpen(false)}
            aria-hidden="true"
          />
        )}
        {isMobileAddOpen && (
          <motion.section
            key="sheet"
            id="add-bookmark-mobile"
            aria-label="Add a bookmark"
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            dragControls={dragControls}
            dragListener={false}
            onDragEnd={(_, info) => {
              // Dismiss bottom sheet when drag gesture exceeds distance or velocity thresholds
              if (info.offset.y > 100 || info.velocity.y > 500) {
                setIsMobileAddOpen(false);
              }
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{ willChange: 'transform' }}
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface p-6 rounded-t-[24px] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.5)] border-t border-line max-h-[90vh] overflow-y-auto overscroll-contain"
          >
            <div
              className="w-full flex justify-center py-2 mb-4 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
              style={{ touchAction: 'none' }}
            >
              <div className="w-12 h-1.5 bg-line rounded-full" />
            </div>
            <AddBookmarkForm
              onProcessing={(p) => {
                bookmarkListRef.current?.addBookmark(p);
                setIsMobileAddOpen(false);
              }}
              onCreated={(b) => {
                const { _tempId, ...realBookmark } = b;
                bookmarkListRef.current?.replaceBookmark(_tempId, realBookmark);
              }}
              onFailed={(tempId) => bookmarkListRef.current?.removeBookmark(tempId)}
            />
          </motion.section>
        )}
      </AnimatePresence>

      <BookmarkList ref={bookmarkListRef} onAdd={() => setIsAddOpen(true)} />
    </div>
  );
}