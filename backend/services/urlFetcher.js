const cheerio = require('cheerio');
const { YoutubeTranscript } = require('youtube-transcript');

const FETCH_TIMEOUT_MS = 6000;
const MAX_CHARS = 25000;

async function fetchPageData(url) {
  if (!url) return { content: null, fetchedTitle: null };

  let content = null;
  let fetchedTitle = null;

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
      return { content, fetchedTitle };
    }
  } catch (err) {
    clearTimeout(ytTimeoutId);
    console.error('urlFetcher: youtube transcript failed —', err.message);
    return { content, fetchedTitle };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
    });

    if (!res.ok) return { content: null, fetchedTitle: null };

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return { content: null, fetchedTitle: null };

    const html = await res.text();
    const $ = cheerio.load(html);

    fetchedTitle = $('title').text().trim() || null;

    $('script, style, nav, footer, header, noscript, iframe').remove();

    const text = $('body').text().replace(/\s+/g, ' ').trim();

    if (text) {
      content = text.slice(0, MAX_CHARS);
    }
    
    return { content, fetchedTitle };
  } catch (err) {
    console.error('urlFetcher: fetch failed —', err.message);
    return { content: null, fetchedTitle: null };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchPageData };