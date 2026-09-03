import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Folder, Search } from 'lucide-react';
import { apiClient } from '../api/client';
import type { CollectionGroup } from '../types/bookmark';
import { Badge } from '../components/Badge';
import { useOutletContext } from 'react-router-dom';
import type { AppShellContext } from '../components/AppShell';
import { usePageTitle } from '../lib/usePageTitle';

export default function MobileCollections() {
  usePageTitle('Collections');
  const [collections, setCollections] = useState<CollectionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { setIsSearchOpen } = useOutletContext<AppShellContext>();

  useEffect(() => {
    async function fetchCollections() {
      try {
        const res = (await apiClient.get('/api/bookmarks/collections')) as { data: CollectionGroup[] };
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
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-20">
      <div>
        <div className="flex items-center gap-3">
          <Folder className="size-6 text-muted" aria-hidden="true" />
          <h1 className="text-h2 font-semibold text-ink">Collections</h1>
        </div>
        {/* Mobile Search Bar directly under heading */}
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

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-lg bg-surface border border-line animate-pulse" />
          ))}
        </div>
      ) : collections.length === 0 ? (
        <div className="p-8 text-center text-muted bg-surface border border-line rounded-xl">
          <Folder className="size-8 mx-auto mb-3 opacity-50" aria-hidden="true" />
          <p className="text-base font-medium text-ink">No collections yet</p>
          <p className="text-small mt-1">Assign collections to your bookmarks to organize them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {collections.map((c) => (
            <Link
              key={c._id}
              to={`/collections/${encodeURIComponent(c._id)}`}
              className="flex items-center justify-between p-4 rounded-xl bg-surface border border-line shadow-sm hover:border-accent hover:shadow-md active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent group"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-full bg-accent-subtle flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                  <Folder className="size-5" />
                </div>
                <span className="font-medium text-ink text-small truncate group-hover:text-accent transition-colors">
                  {c._id}
                </span>
              </div>
              <Badge variant="neutral" className="tabular-nums shrink-0">
                {c.count} {c.count === 1 ? 'item' : 'items'}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
