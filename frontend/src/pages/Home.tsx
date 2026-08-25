import { useEffect, useRef, useState } from 'react';
import { apiClient } from '../api/client';
import BookmarkList from '../components/BookmarkList';
import AddBookmarkForm from '../components/AddBookmarkForm';

interface HealthStatus {
  status: string;
  message: string;
}

interface BookmarkListHandle {
  addBookmark: (bookmark: unknown) => void;
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

      { }
      <section id="add-bookmark" aria-label="Add a bookmark">
        <AddBookmarkForm onCreated={(b: unknown) => bookmarkListRef.current?.addBookmark(b)} />
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