import { useEffect, useState, useRef } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import BookmarkList from '../components/BookmarkList';
import AddBookmarkForm from '../components/AddBookmarkForm';

export default function Home() {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [health, setHealth] = useState(null);
    const [error, setError] = useState(null);
    const bookmarkListRef = useRef();

    useEffect(() => {
        apiClient
            .get('/api/health')
            .then(setHealth)
            .catch((err) => setError(err.message));
    }, []);

    const handleLogout = async () => {
        await logout();
        showToast('Logged out successfully', 'success');
    };

    return (
        <div>
            {user && (
                <p>
                    Logged in as {user.email} <button onClick={handleLogout}>Logout</button>
                </p>
            
            )}
            <AddBookmarkForm onCreated={(b) => bookmarkListRef.current?.addBookmark(b)} />
            <BookmarkList ref={bookmarkListRef} />
            {error && <p>Backend error: {error}</p>}
            {!health && !error && <p>Checking backend…</p>}
            {health && (
                <p>
                    Backend status: {health.status} — {health.message}
                </p>
            )}
        </div>
    );
}