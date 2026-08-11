const { GoogleGenerativeAI } = require('@google/generative-ai');
const { fetchPageText } = require('./urlFetcher');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a 2-sentence summary and 3 tags from a bookmark's URL and/or note.
 * Priority for source content: fetched page text -> note -> raw url string.
 * Returns { summary: null, tags: [] } on any failure so bookmark
 * creation is never blocked by an AI outage or fetch failure.
 */
async function generateSummaryAndTags({ url, note }) {
  let content = null;

  if (url) {
    content = await fetchPageText(url);
  }
  if (!content) {
    content = note || url || null;
  }
  if (!content) return { summary: null, tags: [] };

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

    const prompt = `You will be given content extracted from a bookmark (either full page text or a user note).
Respond with ONLY raw JSON, no markdown fences, no preamble, in this exact shape:
{"summary": "<exactly 2 sentences summarizing the content>", "tags": ["<tag1>", "<tag2>", "<tag3>"]}

Content:
${content}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text();
    const cleaned = raw.replace(/```json|```/g, '').trim();

    const parsed = JSON.parse(cleaned);

    if (typeof parsed.summary !== 'string' || !Array.isArray(parsed.tags)) {
      throw new Error('Unexpected AI response shape');
    }

    return {
      summary: parsed.summary,
      tags: parsed.tags.slice(0, 3),
    };
  } catch (err) {
    console.error('aiService: generation failed —', err.message);
    return { summary: null, tags: [] };
  }
}

module.exports = { generateSummaryAndTags };