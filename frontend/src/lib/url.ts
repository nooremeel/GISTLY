/**
 * Best-effort `https://example.com/path` → `example.com`.
 * Strips the `www.` prefix. Returns `null` (rather than the raw string) on
 * anything `URL` can't parse, so callers can fall back gracefully instead
 * of showing a mangled domain.
 *
 * Extracted from `BookmarkCard.tsx` and `ProcessingCard.tsx` which both had
 * identical private copies of this function.
 */
export function getDomain(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.includes('://') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}
