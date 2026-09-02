const { GoogleGenerativeAI } = require('@google/generative-ai');
const { fetchPageData } = require('./urlFetcher');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a 2-sentence summary and 3 tags from a bookmark's URL and/or note.
 * Priority for source content: fetched page text -> note -> raw url string.
 * Returns { summary: null, tags: [] } on any failure so bookmark
 * creation is never blocked by an AI outage or fetch failure.
 */
async function generateSummaryAndTags({ url, note, userTags = [] }) {
  let content = null;
  let fetchedTitle = null;
  let fetchedImage = null;
  let isJustUrl = false;

  if (url) {
    const data = await fetchPageData(url);
    content = data.content;
    fetchedTitle = data.fetchedTitle;
    fetchedImage = data.fetchedImage;
  }
  if (!content) {
    if (note) {
      content = note;
    } else if (url) {
      content = url;
      isJustUrl = true;
    }
  }
  if (!content) return { summary: null, tags: [], fetchedTitle, fetchedImage };

  let aiTimeoutId;
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

    const userTagsContext = userTags && userTags.length > 0
      ? `5. The user already added these tags: [${userTags.join(', ')}]. DO NOT output tags that are identical or highly similar to these.`
      : '';

    const urlOnlyContext = isJustUrl
      ? `\nCRITICAL URL ONLY MODE: The webpage text could not be fetched. You ONLY have the URL below. Deduce the topic purely from the URL slug and write a simple 1-sentence summary (e.g. "A comparison between MediaTek Dimensity 8350 and Google Tensor G6"). Do NOT hallucinate facts, specs, or insights you cannot see.`
      : '';

    const prompt = `You are an expert researcher. You are given content extracted from a saved bookmark.
Your task is to extract the MOST valuable insight and assign high-level categories.

CRITICAL RULES FOR SUMMARY:
1. DO NOT write a generic summary like "This page discusses...".
2. Dive straight into the core thesis or bottom-line value.
3. Be highly specific.
4. Write exactly 2 sentences. Make them punchy.

CRITICAL RULES FOR TAGS:
1. Provide 0 to 3 tags maximum.
2. Only use broad, highly reusable categories (e.g., "design", "programming", "finance", "health").
3. DO NOT create hyper-specific, generic, or useless tags (e.g., "tips", "video", "how-to", "website"). 
4. If no broad category strongly applies, leave the tags array EMPTY [].
${userTagsContext}
${urlOnlyContext}

Respond with ONLY raw JSON, no markdown fences, no preamble, in this exact shape:
{"summary": "<2 highly specific, valuable sentences>", "tags": ["<broad_category_if_any>"]}

Content:
${content}`;

    const generatePromise = model.generateContent(prompt);
    generatePromise.catch(() => {}); // Prevent unhandled rejection if timeout wins

    const aiTimeoutPromise = new Promise((_, reject) => {
      aiTimeoutId = setTimeout(() => reject(new Error('Gemini API timeout')), 30000);
    });
    
    const result = await Promise.race([generatePromise, aiTimeoutPromise]);
    clearTimeout(aiTimeoutId);
    
    const raw = result.response.text();
    const cleaned = raw.replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(cleaned);

    if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.tags)) {
      throw new Error('Unexpected AI response shape');
    }

    return {
      summary: parsed.summary,
      tags: parsed.tags.slice(0, 3),
      fetchedTitle,
      fetchedImage,
    };
  } catch (err) {
    clearTimeout(aiTimeoutId);
    console.error('aiService: generation failed —', err.message);
    return { summary: null, tags: [], fetchedTitle, fetchedImage };
  }
}

module.exports = { generateSummaryAndTags };