import { NavLink, useLocation } from 'react-router-dom';
import { Library, Plus, Folder, Tags } from 'lucide-react';
import { cx } from '../lib/cx';
import AccountMenu from './AccountMenu';

export interface MobileTabBarProps {
  onOpenAdd: () => void;
}

const tabBase = [
  'flex flex-col items-center justify-center gap-1 flex-1 py-2',
  'text-[10px] font-medium select-none',
  'active:scale-95 transition-transform duration-100',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
].join(' ');

export default function MobileTabBar({ onOpenAdd }: MobileTabBarProps) {
  const location = useLocation();
  const isCollectionsActive = location.pathname.startsWith('/collections');
  const isTagsActive = location.pathname.startsWith('/tags');

  const handleTabClick = () => {
    // Blur any active element so mobile browsers never trap focus or suppress subsequent taps
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex h-[60px] items-center border-t border-line bg-surface px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] select-none touch-manipulation"
      style={{ touchAction: 'manipulation' }}
    >
      <NavLink
        to="/library"
        end
        onClick={handleTabClick}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        className={({ isActive }) =>
          cx(tabBase, isActive ? 'text-accent font-semibold' : 'text-muted active:text-ink')
        }
      >
        <Library className="size-5" />
        Library
      </NavLink>

      <NavLink
        to="/tags"
        onClick={handleTabClick}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        className={({ isActive }) =>
          cx(tabBase, isActive || isTagsActive ? 'text-accent font-semibold' : 'text-muted active:text-ink')
        }
      >
        <Tags className="size-5" />
        Tags
      </NavLink>

      <div
        className="flex-1 flex items-center justify-center relative h-full cursor-pointer"
        onClick={() => {
          handleTabClick();
          onOpenAdd();
        }}
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleTabClick();
            onOpenAdd();
          }}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="absolute -top-7 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-xl active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          aria-label="Add Bookmark"
        >
          <Plus className="size-7" />
        </button>
      </div>

      <NavLink
        to="/collections"
        onClick={handleTabClick}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        className={({ isActive }) =>
          cx(tabBase, isActive || isCollectionsActive ? 'text-accent' : 'text-muted active:text-ink')
        }
      >
        <Folder className="size-5" />
        Collections
      </NavLink>

      <AccountMenu variant="tab" />
    </nav>
  );
}
