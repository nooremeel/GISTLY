import { useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const location = useLocation();
  const touchStartY = useRef<number | null>(null);

  const isCollectionsActive = location.pathname.startsWith('/collections');
  const isTagsActive = location.pathname.startsWith('/tags');

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchNav = (to: string) => (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const delta = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (delta > 10) return;
    }
    // Prevent WebKit from synthesizing a delayed or dropped click event on touch devices
    e.preventDefault();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (location.pathname === to) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(to);
    }
  };

  const handleTabClick = (to: string) => (e: React.MouseEvent) => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    if (location.pathname === to) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleTouchAdd = (e: React.TouchEvent) => {
    if (touchStartY.current !== null) {
      const delta = Math.abs(e.changedTouches[0].clientY - touchStartY.current);
      if (delta > 10) return;
    }
    e.preventDefault();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onOpenAdd();
  };

  const handleClickAdd = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onOpenAdd();
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex h-[60px] items-center border-t border-line bg-surface px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.02)] select-none touch-manipulation"
      style={{ touchAction: 'manipulation' }}
    >
      <NavLink
        to="/library"
        end
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchNav('/library')}
        onClick={handleTabClick('/library')}
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
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchNav('/tags')}
        onClick={handleTabClick('/tags')}
        style={{ WebkitTapHighlightColor: 'transparent' }}
        className={({ isActive }) =>
          cx(tabBase, isActive || isTagsActive ? 'text-accent font-semibold' : 'text-muted active:text-ink')
        }
      >
        <Tags className="size-5" />
        Tags
      </NavLink>

      <div className="flex-1 flex items-center justify-center relative h-full">
        <button
          type="button"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchAdd}
          onClick={handleClickAdd}
          style={{ WebkitTapHighlightColor: 'transparent' }}
          className="absolute -top-7 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-paper shadow-xl active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
          aria-label="Add Bookmark"
        >
          <Plus className="size-7" />
        </button>
      </div>

      <NavLink
        to="/collections"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchNav('/collections')}
        onClick={handleTabClick('/collections')}
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
