import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Folder, Search } from 'lucide-react';
import { apiClient } from '../api/client';
import type { CollectionGroup } from '../types/bookmark';
import { Badge } from '../components/Badge';
import { useOutletContext } from 'react-router-dom';
import type { AppShellContext } from '../components/AppShell';

export default function MobileCollections() {
  const [collections, setCollections] = useState<CollectionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { setIsSearchOpen } = useOutletContext<AppShellContext>();

  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = (await apiClient.get('/api/bookmarks/grouped')) as { data: CollectionGroup[] };
        setCollections(res.data);
      } catch (err) {
        console.error('Failed to fetch collections', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCollections();
  }, []);

  return (
    <div className="flex flex-col gap-6 md:hidden">
      <div>
        <h1 className="text-h1">Collections</h1>
        {/* Mobile Search Bar directly under heading */}
        <div className="mt-4">
          <div
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center w-full px-4 py-2.5 bg-surface border border-line rounded-md text-muted cursor-text"
          >
            <Search className="mr-2 size-5" />
            <span className="text-small">Search your library...</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-small text-faint">Loading collections...</div>
      ) : collections.length === 0 ? (
        <div className="text-small text-faint">No collections yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {collections.map((c) => (
            <Link
              key={c._id}
              to={`/collections/${encodeURIComponent(c._id)}`}
              className="flex items-center justify-between p-4 rounded-xl bg-surface border border-line shadow-sm active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent-subtle flex items-center justify-center text-accent">
                  <Folder className="size-5" />
                </div>
                <span className="font-medium text-ink">{c._id}</span>
              </div>
              <Badge variant="neutral" className="tabular-nums">
                {c.count} items
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
