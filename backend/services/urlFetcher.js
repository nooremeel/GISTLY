const cheerio = require('cheerio');

const FETCH_TIMEOUT_MS = 6000;
const MAX_CHARS = 6000;

async function fetchPageText(url) {
  if (!url) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BookmarkBot/1.0)' },
    });

    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    $('script, style, nav, footer, header, noscript, iframe').remove();

    const text = $('body').text().replace(/\s+/g, ' ').trim();

    if (!text) return null;

    return text.slice(0, MAX_CHARS);
  } catch (err) {
    console.error('urlFetcher: fetch failed —', err.message);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { fetchPageText };