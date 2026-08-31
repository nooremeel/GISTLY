import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { apiClient } from '../api/client';
import BookmarkList from '../components/BookmarkList';
import type { BookmarkListHandle } from '../components/BookmarkList';
import AddBookmarkForm from '../components/AddBookmarkForm';
import { Search } from 'lucide-react';
import { getGreeting } from '../lib/greeting';

import type { AppShellContext } from '../components/AppShell';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

interface HealthStatus {
  status: string;
  message: string;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bookmarkListRef = useRef<BookmarkListHandle>(null);
  const { isMobileAddOpen, setIsMobileAddOpen, setIsSearchOpen } = useOutletContext<AppShellContext>();
  const dragControls = useDragControls();

  useEffect(() => {
    apiClient
      .get('/api/health')
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h1">{getGreeting()}.</h1>
        {/* Mobile Search Bar directly under heading */}
        <div className="md:hidden mt-4">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center w-full px-4 py-2.5 bg-surface border border-line rounded-md text-muted cursor-text"
          >
            <Search className="mr-2 size-5" />
            <span className="text-small">Search your library...</span>
          </div>
        </div>
      </div>

      {/* Desktop inline form */}
      <section
        id="add-bookmark-desktop"
        aria-label="Add a bookmark"
        className="hidden md:block"
      >
        <AddBookmarkForm
          onProcessing={(p) => bookmarkListRef.current?.addBookmark(p)}
          onCreated={(b) => {
            const { _tempId, ...realBookmark } = b;
            bookmarkListRef.current?.replaceBookmark(_tempId, realBookmark);
          }}
        />
      </section>

      {/* Mobile: Framer Motion bottom sheet when open. */}
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
              // Close if dragged down far enough or fast enough
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
                setIsMobileAddOpen(false); // Close sheet on mobile after submit
              }}
              onCreated={(b) => {
                const { _tempId, ...realBookmark } = b;
                bookmarkListRef.current?.replaceBookmark(_tempId, realBookmark);
              }}
            />
          </motion.section>
        )}
      </AnimatePresence>

      <BookmarkList ref={bookmarkListRef} />

      {(error || !health) && (
        <p className="text-small text-faint">
          {error ? `Backend error: ${error}` : 'Checking backend…'}
        </p>
      )}
    </div>
  );
}