# Gistly

**Save a link. Get the gist. Instantly.**

Gistly is a full-stack bookmark manager powered by Google Gemini AI. Drop in any URL — an article, a YouTube video, a GitHub repo, a blog post — and Gistly reads it, distills it into a sharp two-sentence summary, and files it under smart tags. No more open tabs you'll never revisit. No more forgetting why you saved something.

---

## What Makes Gistly Different

### 🧠 AI That Actually Reads the Page
Most tools just store URLs. Gistly fetches the page, strips the noise, and sends the real content to Gemini. For YouTube videos, it pulls the full transcript — so the AI is summarizing what was *said*, not just the title.

### ✍️ Summaries Worth Reading
The prompt engineering behind Gistly is deliberate: no filler phrases like "This page discusses..." — just the core thesis in two punchy sentences. Every summary is specific, opinionated, and useful.

### 🏷️ Tags That Scale
Tags are broad, reusable categories (`design`, `finance`, `programming`) — not noise. Gistly's AI is explicitly instructed to leave the tag array empty if nothing meaningful applies, and it respects tags you've already applied so it never creates duplicates.

### 🔒 Security Built In from Day One
- Passwords hashed with **bcrypt** (≥10 salt rounds)
- Auth via **httpOnly, SameSite=Lax JWT cookies** — no tokens in localStorage
- **Helmet** security headers on every response
- **MongoDB injection sanitization** via `express-mongo-sanitize`
- **SSRF protection** in the URL fetcher — private IPs, loopback, and cloud metadata endpoints are blocked before any outbound request is made
- **Rate limiting** per route: 10 auth attempts per 15 minutes, 20 AI-powered bookmark creations per hour

### 🏗️ Resilience by Design
Gistly never lets an AI hiccup break your workflow. Every external call — Gemini, the URL fetcher, YouTube transcript — has its own timeout and a graceful fallback. An AI outage means your bookmark is saved without a summary; it doesn't mean your request fails.

### 🔍 Full-Text Search
A compound MongoDB text index across `title`, `note`, `url`, and `tags` powers instant full-text search across your entire library — no external search service required.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express 5, MongoDB / Mongoose |
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS v4 |
| **AI** | Google Gemini (`gemini-3.5-flash`) via the official SDK |
| **Auth** | JWT in httpOnly cookies, bcrypt password hashing |
| **Web Scraping** | Cheerio (HTML), `youtube-transcript` (video) |
| **Email** | Nodemailer with SMTP (sandboxed via Ethereal in dev) |
| **Testing** | Jest + Supertest, `mongodb-memory-server` (no real DB needed) |

---

## Feature Overview

- **Add bookmarks** from any public URL or as a plain-text note
- **AI-generated summaries and tags** on every save, with graceful degradation if unavailable
- **YouTube-native**: full transcript is fetched and summarized, not just the title
- **Collections** to organise bookmarks into named folders
- **Tag filtering and full-text search** across your entire library
- **Edit and delete** with optimistic UI updates and toast feedback
- **Pagination** — load more as you go, keeping initial loads fast
- **Forgot / reset password** flow with email delivery
- **Image extraction** from Open Graph / Twitter card metadata
- **Protected routes** — all data is strictly scoped to the authenticated user; no cross-user data leakage is possible by design

---

## Getting Started

### Prerequisites
- Node.js ≥ 18
- A running MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Backend
```bash
cd backend
npm install
cp ../.env.example .env   # then fill in the required values
npm run dev
```
Server starts at `http://localhost:5000`.

### Frontend
```bash
cd frontend
npm install
# create frontend/.env with VITE_API_BASE_URL=http://localhost:5000
npm run dev
```
App starts at `http://localhost:5173`.

### Tests
```bash
cd backend
npm test
```
Tests run against an **in-memory MongoDB instance** — no real database, no network calls. Gemini responses are mocked.

---

## Environment Variables

### Backend (`.env` at project root)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `JWT_SECRET` | Secret used to sign JWTs (keep this strong and private) |
| `PORT` | Backend port (default: `5000`) |
| `CLIENT_ORIGIN` | Allowed CORS origin(s) — comma-separate multiple values |
| `NODE_ENV` | `development` or `production` — controls cookie `Secure` flag |
| `SMTP_HOST` | *(Optional)* SMTP host for email delivery |
| `SMTP_PORT` | *(Optional)* SMTP port (default: `587`) |
| `SMTP_USER` | *(Optional)* SMTP username |
| `SMTP_PASS` | *(Optional)* SMTP password |
| `EMAIL_FROM` | *(Optional)* Sender address for outgoing emails |

> If SMTP vars are omitted, the email service falls back to an Ethereal sandbox — links are printed to the console instead of delivered.

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL (e.g. `http://localhost:5000`) |

---

## Deployment Checklist

- [ ] Set `NODE_ENV=production` on the backend — this flips auth cookies to `Secure: true`
- [ ] Set `CLIENT_ORIGIN` to your deployed frontend's exact origin (no trailing slash)
- [ ] Use a strong, randomly generated `JWT_SECRET` (e.g. `openssl rand -base64 64`)
- [ ] Ensure MongoDB Atlas IP allowlist includes your backend's host
- [ ] Configure your SMTP credentials for live email delivery

---

## Known Limitations

- Near-duplicate tags (e.g. `"Node.js"` vs `"NodeJS"`) aren't semantically deduplicated — only exact case-insensitive matches are caught.
- Tag pills in the filter bar are derived from the currently loaded bookmarks; tags from unloaded pages won't appear until those pages are loaded.
- No CSRF token protection — auth relies on `SameSite=Lax` cookies. Acceptable for most deployments; consider explicit CSRF tokens before handling high-value mutations at scale.
- No CI pipeline yet — backend tests must be run manually.