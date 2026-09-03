import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { TagGroup } from '../types/bookmark';
import { Tags as TagsIcon, Hash, Search } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import type { AppShellContext } from '../components/AppShell';
import { usePageTitle } from '../lib/usePageTitle';

export default function TagsView() {
  usePageTitle('Tags');
  const { setIsSearchOpen } = useOutletContext<AppShellContext>();
  const [tags, setTags] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTags() {
      try {
        const res = (await apiClient.get('/api/bookmarks/tags')) as { data: TagGroup[] };
        setTags(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tags');
      } finally {
        setLoading(false);
      }
    }
    fetchTags();
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full pb-20">
      <div>
        <div className="flex items-center gap-3">
          <TagsIcon className="size-6 text-muted" />
          <h1 className="text-h2 font-semibold text-ink">Tags Directory</h1>
        </div>
        
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

      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-surface border border-line animate-pulse" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-4 bg-error-subtle text-error rounded-md text-small">
          {error}
        </div>
      ) : tags.length === 0 ? (
        <div className="p-8 text-center text-muted bg-surface border border-line rounded-xl">
          <Hash className="size-8 mx-auto mb-3 opacity-50" />
          <p className="text-base font-medium text-ink">No tags yet</p>
          <p className="text-small mt-1">Tags you add to your bookmarks will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <Link
              key={tag._id}
              to={`/tags/${encodeURIComponent(tag._id)}`}
              className="flex items-center justify-between p-4 bg-surface border border-line rounded-lg hover:border-accent hover:shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-paper group"
            >
              <div className="flex items-center gap-2 truncate">
                <Hash className="size-4 text-muted group-hover:text-accent transition-colors shrink-0" />
                <span className="font-medium text-ink text-small truncate">{tag._id}</span>
              </div>
              <span className="text-micro font-medium text-muted bg-accent-subtle px-2 py-0.5 rounded-full shrink-0">
                {tag.count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
