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
`feature/04-auth-backend`

## Completed Tasks
- **Task 01 — Project Scaffolding:** Created `/backend` and `/frontend` folders, ran `npm init -y` in both, added root `.gitignore` (excludes `node_modules`, `.env`, build output, logs), root `.env.example` documenting `MONGODB_URI`, `GEMINI_API_KEY`, `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`, and root `README.md`. Initialized git locally, made first commit on `feature/01-setup`, and pushed to a new GitHub remote (`origin`). No deviations from plan — matched all "Done When" criteria.
- **Task 02 — Express Server & MongoDB Connection:** Installed `express`, `mongoose`, `dotenv` (plus `nodemon` as a dev dependency). Created `backend/config/db.js` exporting an async `connectDB()` function that connects Mongoose to `MONGODB_URI` and exits the process on failure. Created `backend/server.js` that loads env vars via `dotenv`, calls `connectDB()`, applies `express.json()`, and exposes `GET /api/health` returning `{ status: 'ok', message: 'Server is healthy' }`. Added `dev`/`start` scripts to `backend/package.json`. No deviations — `GET /api/health` returns 200 and MongoDB connects cleanly on startup.
- **Task 03 — Foundational Middleware:** Created `backend/config/env.js` exporting `validateEnv()`, called at the top of `server.js` (right after `dotenv.config()`), which checks `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` are present and exits the process with a clear console error if any are missing. Created `backend/middleware/security.js` exporting `applySecurityMiddleware(app)`, which applies `helmet()`, `cors()` (using `CLIENT_ORIGIN` with `credentials: true`), and a custom in-place Mongo-injection sanitizer. Added `morgan('dev')` request logging in `server.js`, active only when `NODE_ENV !== 'production'`. **Deviation:** `express-mongo-sanitize` v1.x is incompatible with Express 5 (it tries to reassign `req.query`, which is a getter-only property in Express 5, and throws at request time). Replaced it with a hand-written `mongoSanitize` middleware in `backend/middleware/security.js` that recursively strips `$`/`.` keys from `req.body`, `req.params`, and `req.query` by mutating objects in place rather than reassigning them — same protection, Express-5-safe. Verified via `curl.exe -i http://localhost:5000/api/health` returning 200 with all middleware active.

## In Progress
- Task 04 — User Authentication Backend

## Immediate Next Task
Task 04: Build registration/login with hashed passwords and JWT issuance, plus reusable middleware that protects routes and attaches the authenticated user to each request. Target files: `backend/models/User.js`, `backend/routes/auth.js`, `backend/controllers/authController.js`, `backend/middleware/auth.js`, `backend/utils/generateToken.js`. Done when `POST /api/auth/register` hashes passwords with bcrypt (salt rounds ≥10) and rejects duplicate emails; `POST /api/auth/login` verifies credentials and returns a JWT in an httpOnly, SameSite=Lax cookie with a set expiry (e.g. 7 days); `POST /api/auth/logout` clears the cookie; and `GET /api/auth/me` (protected) returns the current user only with a valid token, 401 otherwise.

## Key Architectural Decisions
- **AI Provider:** Google Gemini API, accessed via its official SDK from the backend only (never exposed to frontend).
- **Database:** MongoDB with Mongoose for schema/validation. Bookmark schema indexes `user` and compound-indexes `{ user, tags }` for aggregation performance.
- **DB Connection Pattern:** `backend/config/db.js` exports a single async `connectDB()` function, called once at server bootstrap in `server.js`; connection failure exits the process rather than allowing the server to start in a broken state.
- **Auth:** JWT-based sessions. Token issued on login, stored in an httpOnly, SameSite=Lax cookie (not localStorage) to reduce XSS exposure. Passwords hashed with bcrypt, salt rounds ≥10. Token expiry set to 7 days.
- **Authorization Pattern:** Every bookmark query is filtered by `req.user.id`, set via `auth.js` middleware — no bookmark route is ever unprotected.
- **Security Middleware:** `helmet` for headers, `morgan` for request logging, and a custom in-place sanitizer (see Task 03 deviation) against NoSQL injection — all applied at server bootstrap (Task 03), before any feature routes exist.
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
- **Express Version:** Running Express 5.x — any future middleware must be checked for Express 5 compatibility before installing (see Task 03 deviation with `express-mongo-sanitize`).

## Open Questions / Decisions Deferred
- Whether to add CSRF token protection on top of SameSite cookies before deploying publicly.
- Whether to attempt optional Tasks 19–21 (CI pipeline, password reset/email verification, frontend component tests) — deferred as stretch goals since they require extra infrastructure (email provider, CI setup) beyond the core learning goals.

## Notes for Next Session
- Task 03 complete: security middleware, request logging, and env validation are all active in `server.js`. Server refuses to boot with a clear error if `MONGODB_URI`, `JWT_SECRET`, or `GEMINI_API_KEY` are missing — confirmed working. `backend/.env` currently has placeholder values for `JWT_SECRET` and `GEMINI_API_KEY`; `JWT_SECRET` should be replaced with a real random secret before Task 04 (used to sign real JWTs starting now — dummy values are no longer safe to leave in place).
- On Windows, remember `curl` in PowerShell is aliased to `Invoke-WebRequest` and doesn't accept curl-style flags — use `curl.exe` for real curl syntax, or use `Invoke-WebRequest -Uri ...` for native PowerShell syntax.
- Starting Task 04: will need `bcrypt` (or `bcryptjs`) and `jsonwebtoken` installed in `/backend`. `backend/models/User.js` needs `email` (unique, required) and `password` (hashed) fields at minimum. `backend/utils/generateToken.js` should centralize JWT signing so `authController.js` and any future token-refresh logic share one implementation. `backend/middleware/auth.js` should read the JWT from the httpOnly cookie (not an Authorization header, per the cookie-based auth decision above), verify it, and attach the decoded user to `req.user`.