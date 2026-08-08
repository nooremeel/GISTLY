# Project State Tracker

## Update Protocol (read this before editing)
After finishing a task, before touching the next branch:
1. Move the finished task from "In Progress" to "Completed Tasks" — one line: what was actually built, and any deviation from the plan.
2. Update "Current Active Branch" to the next task's branch name (copy from PROJECT_PLAN.md).
3. Rewrite "Immediate Next Task" using that task's Goal from PROJECT_PLAN.md.
4. If you made a decision not already listed below (library choice, schema tweak, naming convention), add it to "Key Architectural Decisions."
5. If something is unresolved, add it to "Open Questions."
6. Commit this file in the same commit as the task's final code change, or in the merge commit.
7. Starting a new chat/context window for the next task? Paste this whole file + the relevant task block from PROJECT_PLAN.md as your first message.

## Current Active Branch
`feature/03-foundational-middleware`

## Completed Tasks
- **Task 01 — Project Scaffolding:** Created `/backend` and `/frontend` folders, ran `npm init -y` in both, added root `.gitignore` (excludes `node_modules`, `.env`, build output, logs), root `.env.example` documenting `MONGODB_URI`, `GEMINI_API_KEY`, `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`, and root `README.md`. Initialized git locally, made first commit on `feature/01-setup`, and pushed to a new GitHub remote (`origin`). No deviations from plan — matched all "Done When" criteria.
- **Task 02 — Express Server & MongoDB Connection:** Installed `express`, `mongoose`, `dotenv` (plus `nodemon` as a dev dependency). Created `backend/config/db.js` exporting an async `connectDB()` function that connects Mongoose to `MONGODB_URI` and exits the process on failure. Created `backend/server.js` that loads env vars via `dotenv`, calls `connectDB()`, applies `express.json()`, and exposes `GET /api/health` returning `{ status: 'ok', message: 'Server is healthy' }`. Added `dev`/`start` scripts to `backend/package.json`. No deviations — `GET /api/health` returns 200 and MongoDB connects cleanly on startup.

## In Progress
- Task 03 — Foundational Middleware: Security, Logging & Env Validation

## Immediate Next Task
Task 03: Add baseline hardening before any real routes exist: security headers, request logging, injection sanitization, CORS for local dev, and a startup check that fails fast if required env vars are missing. Target files: `backend/server.js`, `backend/config/env.js`, `backend/middleware/security.js`. Done when `helmet` is applied globally, `morgan` logs requests in dev mode, `express-mongo-sanitize` strips `$`/`.` operators from incoming data, CORS allows `CLIENT_ORIGIN` with `credentials: true`, and the server refuses to start (with a clear console error) if `MONGODB_URI`, `JWT_SECRET`, or `GEMINI_API_KEY` are missing.

## Key Architectural Decisions
- **AI Provider:** Google Gemini API, accessed via its official SDK from the backend only (never exposed to frontend).
- **Database:** MongoDB with Mongoose for schema/validation. Bookmark schema indexes `user` and compound-indexes `{ user, tags }` for aggregation performance.
- **DB Connection Pattern:** `backend/config/db.js` exports a single async `connectDB()` function, called once at server bootstrap in `server.js`; connection failure exits the process rather than allowing the server to start in a broken state.
- **Auth:** JWT-based sessions. Token issued on login, stored in an httpOnly, SameSite=Lax cookie (not localStorage) to reduce XSS exposure. Passwords hashed with bcrypt, salt rounds ≥10. Token expiry set to 7 days.
- **Authorization Pattern:** Every bookmark query is filtered by `req.user.id`, set via `auth.js` middleware — no bookmark route is ever unprotected.
- **Security Middleware:** `helmet` for headers, `morgan` for request logging, `express-mongo-sanitize` against NoSQL injection — all applied at server bootstrap (Task 03), before any feature routes exist.
- **CORS:** Configured early for local dev (`CLIENT_ORIGIN`, `credentials: true`), locked to the production frontend origin only at deploy time (Task 18).
- **Rate Limiting:** Auth endpoints throttled against brute force; the AI-calling bookmark-creation route has its own stricter limit to control external API cost.
- **API Style:** REST (not GraphQL) under `/api/*` prefix.
- **Error Handling:** Centralized Express middleware (`errorHandler.js`) rather than per-route try/catch duplication.
- **Pagination:** `page`/`limit` query params on `GET /api/bookmarks`, default limit 12, response includes `total`/`pages` for a "Load more" UI.
- **Testing:** Jest + Supertest for backend integration tests (Task 10), run against a separate test DB; Gemini calls are mocked in tests, never real. Frontend component testing is optional (Task 21).
- **Frontend State:** React Context for auth and toast/notification state; local component state/fetch calls for everything else — no Redux unless complexity demands it later.
- **Notifications:** One centralized toast system (Task 13), built before any feature UI, reused by every later interaction (auth errors, add/edit/delete).
- **Folder/Tag Model:** Tags stored as an array of strings on the Bookmark document; "folders/collections" stored as a separate string field, aggregation done via MongoDB `$group`.
- **XSS Note:** React escapes rendered text content by default; no `dangerouslySetInnerHTML` is used anywhere, so AI-generated summaries/tags are safe to render directly.
- **Repository:** Local git repo initialized in project root; connected to GitHub remote (`origin`). Task branches pushed individually (e.g. `feature/01-setup`) rather than committing directly to `main`.

## Open Questions / Decisions Deferred
- Whether to add CSRF token protection on top of SameSite cookies before deploying publicly.
- Whether to attempt optional Tasks 19–21 (CI pipeline, password reset/email verification, frontend component tests) — deferred as stretch goals since they require extra infrastructure (email provider, CI setup) beyond the core learning goals.

## Notes for Next Session
- Task 02 complete: `backend/server.js` and `backend/config/db.js` exist and work; `/api/health` confirmed returning 200 with MongoDB connected. `backend/.env` populated locally (untracked, per `.gitignore`) with `MONGODB_URI` and `PORT`; `JWT_SECRET` and `GEMINI_API_KEY` not yet added to `.env` since they weren't needed until now.
- Starting Task 03: will need `helmet`, `morgan`, and `express-mongo-sanitize` installed in `/backend`. Will also create `backend/config/env.js` to validate required env vars (`MONGODB_URI`, `JWT_SECRET`, `GEMINI_API_KEY`) at startup and fail fast if any are missing — so `.env` needs `JWT_SECRET` and `GEMINI_API_KEY` filled in (dummy values are fine for `GEMINI_API_KEY` until the AI integration task) before the server will boot after this task.