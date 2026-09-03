# Architecture & Roadmap

## Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express 5, MongoDB / Mongoose |
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS v4 |
| **AI** | Google Gemini (`gemini-3.5-flash`) via the official SDK |
| **Auth** | JWT in httpOnly cookies, bcrypt password hashing |
| **Testing** | Jest + Supertest, `mongodb-memory-server` |

---

## Architecture Overview

Gistly follows a clean separation between a stateless REST API backend and a React single-page application frontend. All authentication state lives in httpOnly cookies — no tokens are ever stored in JavaScript-accessible storage.

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│     React SPA (Vite)    │◄──────►│    Express 5 REST API        │
│  TypeScript + Tailwind  │  HTTP  │  JWT auth · rate limiting    │
└─────────────────────────┘        │  input validation · Helmet   │
                                   └───────────┬──────────────────┘
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                     ┌────────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
                     │   MongoDB     │  │  Gemini AI  │  │  SMTP /    │
                     │  (Mongoose)   │  │  (Gemini    │  │  Nodemailer│
                     └───────────────┘  │   SDK)      │  └────────────┘
                                        └─────────────┘
```

---

## Development Phases

### Phase 1 — Backend Foundation
Establishing the server, database connection, and baseline security middleware before any feature work begins.

- Express server with health-check endpoint
- MongoDB connection via Mongoose
- Helmet security headers, CORS, Morgan logging
- MongoDB injection sanitization (`express-mongo-sanitize`)
- Fail-fast env validation on startup

### Phase 2 — Authentication
Secure, cookie-based auth with no exposure of tokens to client-side JavaScript.

- User registration with bcrypt password hashing (≥10 salt rounds)
- Login issuing JWTs in httpOnly, SameSite=Lax cookies
- Token-verified route protection middleware
- Auth rate limiting (10 attempts per 15 min window)
- Forgot password / reset flow via email token

### Phase 3 — Bookmark Core
The data layer and API for creating, reading, updating, and deleting bookmarks — all strictly scoped to the authenticated user.

- Mongoose schema with compound indexes for user queries, tag aggregation, and full-text search
- Paginated list endpoint (`?page`, `?limit`, `?search`)
- Create / Update / Delete routes, all behind auth middleware
- MongoDB `$group` aggregation for tag and collection views
- Custom validation ensuring at least one of `url` or `note` is present

### Phase 4 — AI Integration
The intelligence layer — content extraction, prompt engineering, and resilient AI calls.

- URL fetcher with SSRF protection (blocks private IPs, loopback, cloud metadata endpoints)
- HTML scraping via Cheerio — page text extracted, boilerplate stripped
- YouTube-native support: full transcript fetched and summarized via `youtube-transcript`
- Open Graph / Twitter Card image extraction
- Gemini structured JSON output (schema-enforced `summary` + `tags`)
- Prompt engineering: summaries are specific and thesis-driven, never generic; tags are broad reusable categories only
- 30-second AI timeout with graceful degradation — bookmark saves even if AI fails
- AI rate limiting (20 creations per hour per IP)

### Phase 5 — Frontend
A polished React SPA with TypeScript, a component design system, and full end-to-end integration with the API.

- AuthContext with session persistence via `GET /api/auth/me` on load
- Protected route guard redirecting unauthenticated users
- Card-based bookmark library with skeleton loading states
- Add bookmark form with real-time AI processing feedback
- Edit and delete with optimistic UI updates and toast notifications
- Sidebar collections view and tag filtering
- Full-text search overlay
- Responsive layout with mobile tab bar navigation
- Global toast notification system (success / error / info)
- Empty state handling throughout

### Phase 6 — Quality & Deployment
Testing, accessibility, and production hardening.

- Jest + Supertest integration tests for all auth and bookmark routes
- In-memory MongoDB (`mongodb-memory-server`) — no real database required to run tests
- Mocked Gemini responses — no real API calls in tests
- Accessible forms with labels and visible focus states
- Production CORS lockdown to deployed frontend origin
- `Secure: true` cookie flag in production via `NODE_ENV`

---

## Planned Improvements

| Feature | Description |
|---|---|
| **CI Pipeline** | Run backend tests automatically on every push via GitHub Actions |
| **Frontend Tests** | React Testing Library coverage for key components |
| **CSRF Protection** | Explicit CSRF tokens for sensitive mutations |
| **Semantic Tag Deduplication** | Merge near-duplicate tags (e.g. `Node.js` / `NodeJS`) at write time |
| **Browser Extension** | One-click bookmark saving from any page |