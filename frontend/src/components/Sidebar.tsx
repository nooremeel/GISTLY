// frontend/src/components/Sidebar.tsx
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Library, Tags as TagsIcon, Folder } from 'lucide-react';
import { Badge } from './Badge';
import { cx } from '../lib/cx';

interface NavItemProps {
  icon: ReactNode;
  label: string;
  to?: string;
  
  comingSoon?: boolean;
}

const navRowBase = [
  'flex w-full items-center gap-2 rounded-md px-3 py-2',
  'text-small font-medium',
  'transition-colors duration-150 motion-reduce:transition-none',
].join(' ');

function NavItem({ icon, label, to, comingSoon }: NavItemProps) {
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
      <span aria-hidden="true" className="size-4">
        {icon}
      </span>
      {label}
    </NavLink>
  );
}


export default function Sidebar() {
  return (
    <nav
      aria-label="Primary"
      className="hidden w-56 shrink-0 flex-col gap-1 border-r border-line px-3 py-6 md:flex"
    >
      <NavItem icon={<Library className="size-4" />} label="Library" to="/" />
      <NavItem icon={<TagsIcon className="size-4" />} label="Tags" comingSoon />
      <NavItem icon={<Folder className="size-4" />} label="Collections" comingSoon />
    </nav>
  );
}