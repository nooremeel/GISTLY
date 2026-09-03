import { useEffect } from 'react';

/**
 * Sets `document.title` for the current page and restores the previous title
 * on unmount. Format: "<title> — Gistly" (or just "Gistly" when no title).
 *
 * Usage:
 *   usePageTitle('Library');  // sets "Library — Gistly"
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title ? `${title} — Gistly` : 'Gistly';
    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
