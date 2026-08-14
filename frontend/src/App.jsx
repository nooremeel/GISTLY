import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { apiClient } from './api/client';

function Home() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.get('/api/health')
      .then(setHealth)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p>Backend error: {error}</p>;
  if (!health) return <p>Checking backend…</p>;

  return <p>Backend status: {health.status} — {health.message}</p>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;