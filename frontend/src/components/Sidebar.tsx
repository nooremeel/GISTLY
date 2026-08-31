import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Library, Tags as TagsIcon, Folder } from 'lucide-react';
import { Badge } from './Badge';
import { cx } from '../lib/cx';
import { apiClient } from '../api/client';
import type { CollectionGroup } from '../types/bookmark';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  to?: string;
  count?: number;
  comingSoon?: boolean;
}

const navRowBase = [
  'flex w-full items-center gap-2 rounded-md px-3 py-2',
  'text-small font-medium',
  'transition-colors duration-150 motion-reduce:transition-none',
].join(' ');

function NavItem({ icon, label, to, count, comingSoon }: NavItemProps) {
  if (comingSoon || !to) {
    return (
      <div
        aria-disabled="true"
        title={`${label} — coming soon`}
        className={cx(navRowBase, 'cursor-not-allowed text-faint')}
      >
        <span aria-hidden="true" className="size-4">
          {icon}
        </span>
        <span className="flex-1 text-left">{label}</span>
        <Badge variant="neutral" className="text-[10px]">
          Soon
        </Badge>
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cx(
          navRowBase,
          isActive
            ? 'bg-accent-subtle text-accent'
            : 'text-muted hover:bg-accent-subtle/60 hover:text-ink',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper'
        )
      }
    >
      <span aria-hidden="true" className="size-4 shrink-0">
        {icon}
      </span>
      <span className="flex-1 text-left truncate">{label}</span>
      {count !== undefined && (
        <Badge variant="neutral" className="text-[10px] tabular-nums shrink-0">
          {count}
        </Badge>
      )}
    </NavLink>
  );
}


export default function Sidebar() {
  const [collections, setCollections] = useState<CollectionGroup[]>([]);
  const [loading, setLoading] = useState(true);

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
    <nav
      aria-label="Primary"
      className="hidden w-56 shrink-0 flex-col gap-1 border-r border-line px-3 py-6 md:flex overflow-y-auto"
    >
      <NavItem icon={<Library className="size-4" />} label="Library" to="/" />
      <NavItem icon={<TagsIcon className="size-4" />} label="Tags" to="/tags" />

      <div className="mt-6 mb-2 px-3 text-micro text-muted font-semibold tracking-wider uppercase">
        Collections
      </div>

      {loading ? (
        <div className="px-3 py-2 text-small text-faint">Loading…</div>
      ) : collections.length === 0 ? (
        <div className="animate-fade-in px-3 py-2 text-small text-faint">No collections yet</div>
      ) : (
        <div className="animate-fade-in flex flex-col gap-1">
          {collections.map((c) => (
            <NavItem
              key={c._id}
              icon={<Folder className="size-4" />}
              label={c._id}
              to={`/collections/${encodeURIComponent(c._id)}`}
              count={c.count}
            />
          ))}
        </div>
      )}
    </nav>
  );
}