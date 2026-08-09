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
`feature/05-bookmark-model`

## Completed Tasks
- **Task 01 — Project Scaffolding:** Created `/backend` and `/frontend` folders, ran `npm init -y` in both, added root `.gitignore` (excludes `node_modules`, `.env`, build output, logs), root `.env.example` documenting `MONGODB_URI`, `GEMINI_API_KEY`, `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`, and root `README.md`. Initialized git locally, made first commit on `feature/01-setup`, and pushed to a new GitHub remote (`origin`). No deviations from plan — matched all "Done When" criteria.
- **Task 02 — Express Server & MongoDB Connection:** Installed `express`, `mongoose`, `dotenv` (plus `nodemon` as a dev dependency). Created `backend/config/db.js` exporting an async `connectDB()` function that connects Mongoose to `MONGODB_URI` and exits the process on failure. Created `backend/server.js` that loads env vars via `dotenv`, calls `connectDB()`, applies `express.json()`, and exposes `GET /api/health` returning `{ status: 'ok', message: 'Server is healthy' }`. Added `dev`/`start` scripts to `backend/package.json`. No deviations — `GET /api/health` returns 200 and MongoDB connects cleanly on startup.
- **Task 03 — Foundational Middleware:** Created `backend/config/env.js` exporting `validateEnv()`, called at the top of `server.js` (right after `dotenv.config()`), which checks `MONGODB_URI`, `JWT_SECRET`, and `GEMINI_API_KEY` are present and exits the process with a clear console error if any are missing. Created `backend/middleware/security.js` exporting `applySecurityMiddleware(app)`, which applies `helmet()`, `cors()` (using `CLIENT_ORIGIN` with `credentials: true`), and a custom in-place Mongo-injection sanitizer. Added `morgan('dev')` request logging in `server.js`, active only when `NODE_ENV !== 'production'`. **Deviation:** `express-mongo-sanitize` v1.x is incompatible with Express 5 (it tries to reassign `req.query`, which is a getter-only property in Express 5, and throws at request time). Replaced it with a hand-written `mongoSanitize` middleware in `backend/middleware/security.js` that recursively strips `$`/`.` keys from `req.body`, `req.params`, and `req.query` by mutating objects in place rather than reassigning them — same protection, Express-5-safe. Verified via `curl.exe -i http://localhost:5000/api/health` returning 200 with all middleware active.
- **Task 04 — User Authentication Backend:** Installed `bcryptjs`, `jsonwebtoken`, `cookie-parser`. Created `backend/models/User.js` (`email` unique/required/lowercase, `password` required with `select: false` so it's excluded from queries by default). Created `backend/utils/generateToken.js` exporting `generateToken(userId)` (signs a JWT with 7-day expiry), `setTokenCookie(res, token)`, and `clearTokenCookie(res)` (both configure the `token` cookie as httpOnly, `SameSite=Lax`, `secure` in production) — centralizes cookie/JWT config so nothing else hardcodes cookie options. Created `backend/controllers/authController.js` exporting `register`, `login`, `logout`, `getMe`: `register` hashes password with `bcrypt.hash` (10 salt rounds) and returns 409 on duplicate email; `login` verifies via `bcrypt.compare` and returns 401 on any mismatch (email or password, same generic message to avoid leaking which one is wrong); `logout` clears the cookie; `getMe` reads `req.user` (set by middleware). Created `backend/middleware/auth.js` exporting `protect` — reads the JWT from the httpOnly cookie (not an Authorization header), verifies it, loads the user by decoded id, attaches to `req.user`, returns 401 on any failure (missing/invalid/expired token or deleted user). Created `backend/routes/auth.js` wiring `POST /register`, `POST /login`, `POST /logout`, `GET /me` (protected). **Deviation:** used `bcryptjs` instead of `bcrypt` — same hash/compare API, pure JS with no native build step, avoids Windows compilation issues. Verified end-to-end with `curl.exe` (register → cookie set → `/me` returns user → logout clears cookie → `/me` returns 401), using `-c cookies.txt` on every call whose response should update the saved cookie state, not just `-b`.

## In Progress
_(none — Task 04 complete, Task 05 not yet started)_

## Immediate Next Task
Task 05: Define the Mongoose schema for a bookmark, including ownership and indexes for query performance. Target file: `backend/models/Bookmark.js`. Done when the schema requires `user` (ref to `User`, required, indexed), validates that `url` or `note` is present, includes `tags` as an array of strings, a `summary` field, a `collection`/folder field, and `createdAt`; a compound index on `{ user, tags }` is added to support the aggregation queries planned for Task 09.

## Key Architectural Decisions
- **AI Provider:** Google Gemini API, accessed via its official SDK from the backend only (never exposed to frontend).
- **Database:** MongoDB with Mongoose for schema/validation. Bookmark schema indexes `user` and compound-indexes `{ user, tags }` for aggregation performance.
- **DB Connection Pattern:** `backend/config/db.js` exports a single async `connectDB()` function, called once at server bootstrap in `server.js`; connection failure exits the process rather than allowing the server to start in a broken state.
- **Auth:** JWT-based sessions. Token issued on login, stored in an httpOnly, `SameSite=Lax` cookie (not localStorage) to reduce XSS exposure. Passwords hashed with `bcryptjs`, salt rounds ≥10. Token expiry set to 7 days. Cookie/JWT logic centralized in `backend/utils/generateToken.js` (`generateToken`, `setTokenCookie`, `clearTokenCookie`) rather than duplicated per-route.
- **Password Field Handling:** `User.password` uses `select: false` in the schema so it's excluded from query results by default; `authController.login` explicitly opts in with `.select('+password')` only where needed.
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
- **bcrypt Library:** Using `bcryptjs` (pure JS) instead of `bcrypt` (native bindings) — avoids native compilation issues on Windows, same `hash`/`compare` API (see Task 04 deviation).
- **Cookie Testing Workflow:** When testing cookie-based auth with `curl.exe`, always pass `-c cookies.txt` (write) alongside `-b cookies.txt` (read) on any request whose response should update the saved cookie — otherwise `Set-Cookie` responses (e.g. from `/logout`) are silently discarded and stale cookies get reused.

## Open Questions / Decisions Deferred
- Whether to add CSRF token protection on top of `SameSite` cookies before deploying publicly.
- Whether to attempt optional Tasks 19–21 (CI pipeline, password reset/email verification, frontend component tests) — deferred as stretch goals since they require extra infrastructure (email provider, CI setup) beyond the core learning goals.

## Notes for Next Session
- Task 04 complete and verified end-to-end via `curl.exe`: register sets cookie, `/me` returns the user with a valid cookie, logout clears the cookie, `/me` returns 401 after logout.
- `JWT_SECRET` in `backend/.env` has been replaced with a real cryptographically random value (generated via `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`) — no longer a placeholder.
- Starting Task 05: only one target file, `backend/models/Bookmark.js`. Needs `user` (ObjectId ref to `User`, required, indexed — mirrors the ownership pattern already established for auth), a validator ensuring at least one of `url` or `note` is present (Mongoose custom/conditional validation, not just two separate `required: true` fields), `tags: [String]`, `summary` (String — will hold Gemini-generated summaries later, per the AI Provider decision), `collection` (String, folder-style grouping per the Folder/Tag Model decision), and `createdAt` (can use schema `timestamps: true` for this, consistent with `User.js`). Compound index `{ user, tags }` needed up front to support Task 09's aggregation queries — don't defer this to later since retrofitting indexes on a populated collection is more disruptive.