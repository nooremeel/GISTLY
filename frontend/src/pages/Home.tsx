import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/client';
import BookmarkList from '../components/BookmarkList';
import AddBookmarkForm from '../components/AddBookmarkForm';
import type { Bookmark } from '../types/bookmark';
import type { ProcessingBookmark } from '../components/ProcessingCard';

interface HealthStatus {
  status: string;
  message: string;
}

interface BookmarkListHandle {
  addBookmark: (bookmark: ProcessingBookmark) => void;
  replaceBookmark: (tempId: string, real: Bookmark & { _animateGist?: boolean }) => void;
}

export default function Home() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const bookmarkListRef = useRef<BookmarkListHandle>(null);

  useEffect(() => {
    apiClient
      .get('/api/health')
      .then(setHealth)
      .catch((err: Error) => setError(err.message));
  }, []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-h1">Your library</h1>
      </div>

      <section id="add-bookmark" aria-label="Add a bookmark">
        <AddBookmarkForm
          onProcessing={(p) => bookmarkListRef.current?.addBookmark(p)}
          onCreated={(b) => {
            const { _tempId, ...realBookmark } = b;
            bookmarkListRef.current?.replaceBookmark(_tempId, realBookmark);
          }}
        />
      </section>

      <BookmarkList ref={bookmarkListRef} />

      {(error || !health) && (
        <p className="text-small text-faint">
          {error ? `Backend error: ${error}` : 'Checking backend…'}
        </p>
      )}
    </div>
  );
}