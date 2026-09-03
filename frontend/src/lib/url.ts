/**
 * Extracts a normalized hostname (stripping `www.`) from a URL string.
 * Returns `null` on unparseable inputs to allow graceful fallback rendering.
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
