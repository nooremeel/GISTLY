import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get('/api/health')
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      {user && (
        <p>
          Logged in as {user.email} <button onClick={logout}>Logout</button>
        </p>
      )}
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