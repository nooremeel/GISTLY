import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, ExternalLink } from 'lucide-react';
import { apiClient } from '../api/client';
import { useToast } from '../context/ToastContext';
import { cx } from '../lib/cx';
import EmptyState from './EmptyState';
import type { Bookmark } from '../types/bookmark';

/** All focusable element types we trap Tab within. */
const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  'input:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { showToast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setResults([]);
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      // Wait for next animation frame so DOM has painted before focusing input
      requestAnimationFrame(() => inputRef.current?.focus());
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    
    const panel = panelRef.current;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      
      if (e.key === 'Tab' && panel) {
        const focusable = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const handler = setTimeout(async () => {
      try {
        const res = (await apiClient.get(
          `/api/bookmarks?search=${encodeURIComponent(searchTerm)}&limit=10`
        )) as { data: Bookmark[] };
        setResults(res.data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed';
        showToast(msg, 'error');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchTerm, isOpen, showToast]);

  // ─── Render ──────────────────────────────────────────────────────────────
  if (!isOpen) return null;

  return createPortal(
    <div
      className={cx(
        "animate-modal-scrim fixed inset-0 z-50 flex justify-center",
        "md:items-start md:p-4 md:pt-[15vh]",
        "items-stretch p-0"
      )}
      style={{ background: 'rgba(23, 22, 26, 0.45)' }}
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search your library"
        className={cx(
          'animate-overlay-expand relative flex flex-col overflow-hidden',
          'md:w-full md:max-w-2xl md:rounded-feature md:border md:border-line md:shadow-lg',
          'w-full h-[100dvh] md:h-auto rounded-none border-none bg-surface'
        )}
        onClick={(e) => e.stopPropagation()}
        aria-hidden={undefined}
      >
        <div className="flex items-center border-b border-line px-4 md:px-6 py-4">
          <Search className="size-5 text-muted mr-3 shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search your library..."
            className="flex-1 bg-transparent text-body font-medium text-ink placeholder:text-faint focus:outline-none min-w-0"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <span className="text-small text-muted animate-pulse shrink-0 ml-3">
              Searching...
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-3 text-small font-medium text-muted hover:text-ink shrink-0 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-1"
          >
            Cancel
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto overscroll-contain md:max-h-[50vh]">
          {!searchTerm.trim() ? (
            <div className="px-6 py-12 text-center">
              <p className="text-body text-muted">
                Start typing to search your library.
              </p>
            </div>
          ) : results.length === 0 && !loading ? (
            <EmptyState variant="search" />
          ) : (
            <div className="flex flex-col py-2">
              {results.map((bookmark) => {
                // Determine display URL vs title
                let domain = '';
                if (bookmark.url) {
                  try {
                    domain = new URL(bookmark.url).hostname.replace(/^www\./, '');
                  } catch {
                    // ignore invalid URL
                  }
                }
                const title = bookmark.title || domain || bookmark.url || 'Untitled bookmark';
                
                const hasUrl = Boolean(bookmark.url);
                const ResultTag = hasUrl ? 'a' : 'div';
                return (
                  <ResultTag
                    key={bookmark._id}
                    {...(hasUrl ? { href: bookmark.url, target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="animate-fade-in flex items-center justify-between px-6 py-3 hover:bg-accent-subtle focus-visible:bg-accent-subtle focus-visible:outline-none transition-colors group cursor-pointer"
                  >
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-body font-medium text-ink truncate group-hover:text-accent group-focus-visible:text-accent transition-colors">
                        {title}
                      </span>
                      {domain && title !== domain && (
                        <span className="text-small text-muted font-mono truncate">
                          {domain}
                        </span>
                      )}
                    </div>
                    {hasUrl && (
                      <ExternalLink className="size-4 text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity shrink-0" aria-hidden="true" />
                    )}
                  </ResultTag>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
