const cheerio = require('cheerio');
const { YoutubeTranscript } = require('youtube-transcript');

const FETCH_TIMEOUT_MS = 6000;
const MAX_CHARS = 25000;

/**
 * Validates whether a URL resolves to a localhost, cloud metadata, or private RFC1918 address
 * to prevent Server-Side Request Forgery (SSRF) vulnerabilities.
 */
function isPrivateOrReservedUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();

    if (!['http:', 'https:'].includes(parsed.protocol)) return true;

    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname === '::1' ||
      hostname === '[::1]'
    ) {
      return true;
    }

    // Cloud metadata service (AWS/GCP/Azure)
    if (hostname.startsWith('169.254.')) return true;

    // Loopback (127.0.0.0/8) & 0.0.0.0/8
    if (/^127\.\d+\.\d+\.\d+$/.test(hostname) || /^0\.\d+\.\d+\.\d+$/.test(hostname)) return true;

    // Private IPv4 subnets (RFC1918)
    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
    const match172 = hostname.match(/^172\.(\d+)\.\d+\.\d+$/);
    if (match172) {
      const secondOctet = parseInt(match172[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) return true;
    }

    return false;
  } catch {
    return true;
  }
}

async function fetchPageData(url) {
  if (!url || isPrivateOrReservedUrl(url)) {
    return { content: null, fetchedTitle: null, fetchedImage: null };
  }

  let content = null;
  let fetchedTitle = null;
  let fetchedImage = null;

  let ytTimeoutId;
  try {
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
    if (isYouTube) {
      try {
        const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          if (oembedData.title && oembedData.author_name) {
             fetchedTitle = `${oembedData.title} - ${oembedData.author_name}`;
          }
          if (oembedData.thumbnail_url) {
             fetchedImage = oembedData.thumbnail_url;
          }
        }
      } catch (e) {
        console.error('urlFetcher: oembed fetch failed', e.message);
      }

      const fetchPromise = YoutubeTranscript.fetchTranscript(url);
      fetchPromise.catch(() => {}); // Prevent unhandled rejection if timeout wins

      const timeoutPromise = new Promise((_, reject) => {
        ytTimeoutId = setTimeout(() => reject(new Error('YoutubeTranscript timeout')), FETCH_TIMEOUT_MS);
      });
      
      const transcriptArray = await Promise.race([fetchPromise, timeoutPromise]);
      clearTimeout(ytTimeoutId);
      if (transcriptArray && transcriptArray.length > 0) {
        const fullTranscript = transcriptArray.map(t => t.text).join(' ').replace(/\s+/g, ' ').trim();
        if (fullTranscript) {
          content = fullTranscript.slice(0, MAX_CHARS);
        }
      }
      return { content, fetchedTitle, fetchedImage };
    }
  } catch (err) {
    clearTimeout(ytTimeoutId);
    console.error('urlFetcher: youtube transcript failed —', err.message);
    return { content, fetchedTitle, fetchedImage };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
    });

    if (!res.ok) return { content: null, fetchedTitle: null, fetchedImage: null };

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return { content: null, fetchedTitle: null, fetchedImage: null };

    const html = await res.text();
    const $ = cheerio.load(html);

    fetchedTitle = $('title').text().trim() || null;
    const rawImage = $('meta[property="og:image"]').attr('content') || 
                     $('meta[name="twitter:image"]').attr('content') || 
                     $('link[rel="image_src"]').attr('href') || 
                     null;

    if (rawImage) {
      try {
        fetchedImage = new URL(rawImage, url).href;
      } catch {
        fetchedImage = null;
      }
    }

    $('script, style, nav, footer, header, noscript, iframe').remove();

    const text = $('body').text().replace(/\s+/g, ' ').trim();

    if (text) {
      content = text.slice(0, MAX_CHARS);
    }
    
    return { content, fetchedTitle, fetchedImage };
  } catch (err) {
    console.error('urlFetcher: fetch failed —', err.message);
    return { content: null, fetchedTitle: null, fetchedImage: null };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchPageData };