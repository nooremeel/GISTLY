# Project Plan: AI-Powered Bookmark & Web Resource Summarizer

## Stack
- Backend: Node.js, Express, MongoDB (Mongoose)
- Auth: JWT (JSON Web Tokens) + bcrypt password hashing, token delivered via httpOnly cookie
- Frontend: React
- AI: Google Gemini API (via official SDK)
- Testing: Jest + Supertest (backend)

## Working Agreement
- One task = one feature branch = one focused context window.
- Do not start a task until the previous one is merged/committed and STATE.md is updated.
- Each task lists: Goal, Target Files, Branch Name, Done When.
- Auth is non-optional: every bookmark route from Task 06 onward must be protected and scoped to the logged-in user.
- Tasks 19–21 are optional stretch goals — not required to consider the project "complete."

---

## Task 01 — Project Scaffolding
**Goal:** Set up monorepo structure, git, and environment config for both backend and frontend.
**Target Files:** `/backend`, `/frontend`, `.gitignore`, `.env.example`, root `README.md`
**Branch:** `feature/01-setup`
**Done When:** `npm init` complete in both folders, folder structure exists, `.env.example` documents required keys (`MONGODB_URI`, `GEMINI_API_KEY`, `JWT_SECRET`, `PORT`, `CLIENT_ORIGIN`).

---

## Task 02 — Express Server & MongoDB Connection
**Goal:** Stand up a minimal Express server with a working MongoDB connection and health-check route.
**Target Files:** `backend/server.js`, `backend/config/db.js`, `backend/.env`
**Branch:** `feature/02-backend-server`
**Done When:** `GET /api/health` returns 200 and MongoDB connects without errors on startup.

---

## Task 03 — Foundational Middleware: Security, Logging & Env Validation
**Goal:** Add baseline hardening before any real routes exist: security headers, request logging, injection sanitization, CORS for local dev, and a startup check that fails fast if required env vars are missing.
**Target Files:** `backend/server.js`, `backend/config/env.js`, `backend/middleware/security.js`
**Branch:** `feature/03-foundational-middleware`
**Done When:**
- `helmet` is applied globally.
- `morgan` logs requests in dev mode.
- `express-mongo-sanitize` strips `$`/`.` operators from incoming request data.
- CORS allows `CLIENT_ORIGIN` (e.g. `http://localhost:5173`) with `credentials: true`.
- Server refuses to start (with a clear console error) if `MONGODB_URI`, `JWT_SECRET`, or `GEMINI_API_KEY` are missing from `.env`.

---

## Task 04 — User Authentication Backend
**Goal:** Build registration/login with hashed passwords and JWT issuance, plus reusable middleware that protects routes and attaches the authenticated user to each request.
**Target Files:** `backend/models/User.js`, `backend/routes/auth.js`, `backend/controllers/authController.js`, `backend/middleware/auth.js`, `backend/utils/generateToken.js`
**Branch:** `feature/04-auth-backend`
**Done When:**
- `POST /api/auth/register` hashes passwords with bcrypt (salt rounds ≥10) and rejects duplicate emails.
- `POST /api/auth/login` verifies credentials and returns a JWT in an httpOnly, SameSite=Lax cookie with a set expiry (e.g. 7 days).
- `POST /api/auth/logout` clears the cookie.
- `GET /api/auth/me` (protected) returns the current user only with a valid token, 401 otherwise.

---

## Task 05 — Bookmark Data Model
**Goal:** Define the Mongoose schema for a bookmark, including ownership and indexes for query performance.
**Target Files:** `backend/models/Bookmark.js`
**Branch:** `feature/05-bookmark-model`
**Done When:** Schema requires `user` (ref to User, required, indexed), validates `url` or `note` is present, `tags` as array of strings, `summary`, `collection`/folder field, `createdAt`. A compound index on `{ user, tags }` is added to support the aggregation queries in Task 09.

---

## Task 06 — Core Bookmark CRUD Routes (Protected) + Pagination
**Goal:** Build Create/Read/Update/Delete routes for bookmarks, all behind the auth middleware and scoped so users only ever see or modify their own data, with pagination on the list endpoint.
**Target Files:** `backend/routes/bookmarks.js`, `backend/controllers/bookmarkController.js`
**Branch:** `feature/06-bookmark-crud`
**Done When:**
- All CRUD endpoints require a valid session; every query filters by `req.user.id`.
- `GET /api/bookmarks` accepts `?page` and `?limit` query params (default limit 12) and returns `{ data, total, page, pages }`.
- Manually verify with two test accounts that User A cannot read, edit, or delete User B's bookmarks.

---

## Task 07 — AI Integration (Summary + Tag Generation)
**Goal:** Add a service that calls the Gemini SDK to generate a 2-sentence summary and 3 tags from a submitted URL or text block.
**Target Files:** `backend/services/aiService.js`, `backend/routes/bookmarks.js` (extend POST route)
**Branch:** `feature/07-ai-integration`
**Done When:** Submitting a bookmark triggers an AI call and the response is saved with `summary` and `tags` populated on that user's bookmark.

---

## Task 08 — Input Validation & Error-Handling Middleware
**Goal:** Add centralized Express error-handling middleware; validate URLs and auth input before processing; gracefully handle AI timeouts/rate limits; rate-limit both auth endpoints and the AI-summary endpoint against abuse.
**Target Files:** `backend/middleware/errorHandler.js`, `backend/middleware/validateInput.js`, `backend/middleware/rateLimiter.js`, `backend/server.js`
**Branch:** `feature/08-error-handling`
**Done When:** Invalid URLs return 400; simulated AI timeout/429 returns a graceful fallback instead of crashing; repeated failed logins are throttled; the bookmark-creation (AI-calling) route has its own stricter rate limit to control API cost.

---

## Task 09 — Tag & Folder Aggregation Queries (Scoped)
**Goal:** Add MongoDB aggregation routes to retrieve the logged-in user's bookmarks grouped by tag and by collection/folder.
**Target Files:** `backend/routes/bookmarks.js`, `backend/controllers/bookmarkController.js` (add `getByTag`, `getGrouped`)
**Branch:** `feature/09-tag-aggregation`
**Done When:** `GET /api/bookmarks/grouped` returns only the authenticated user's bookmarks, correctly bucketed via MongoDB `$group`.

---

## Task 10 — Backend Testing: Auth & Bookmark Routes
**Goal:** Add integration tests for the core backend before moving to frontend work, so regressions are caught early.
**Target Files:** `backend/tests/auth.test.js`, `backend/tests/bookmarks.test.js`, `backend/tests/setup.js` (test DB config)
**Branch:** `feature/10-backend-tests`
**Done When:** Jest + Supertest cover: register/login/logout happy paths, rejected duplicate registration, protected-route 401 without token, bookmark CRUD scoping (User A can't touch User B's data), and at least one AI-integration test using a mocked Gemini response (no real API calls in tests).

---

## Task 11 — React App Scaffolding & API Client
**Goal:** Set up the React app shell, routing, and a shared API client configured to send credentials (cookies) with every request.
**Target Files:** `frontend/src/App.jsx`, `frontend/src/api/client.js`, `frontend/.env`
**Branch:** `feature/11-frontend-setup`
**Done When:** React app runs locally, calls `GET /api/health` successfully, and the API client sends cookies (`credentials: 'include'` or `withCredentials: true`) with the backend base URL read from `frontend/.env`.

---

## Task 12 — Frontend Auth (Context, Pages, Protected Routes)
**Goal:** Build an AuthContext to track login state, Login/Register pages, and a route guard that redirects unauthenticated users.
**Target Files:** `frontend/src/context/AuthContext.jsx`, `frontend/src/pages/Login.jsx`, `frontend/src/pages/Register.jsx`, `frontend/src/components/ProtectedRoute.jsx`
**Branch:** `feature/12-frontend-auth`
**Done When:** User can register, log in, and log out; unauthenticated users are redirected away from the bookmark library; auth state persists across a page refresh (via a `GET /api/auth/me` check on load).

---

## Task 13 — Global Toast/Notification System
**Goal:** Build one reusable notification mechanism (success/error/info toasts) so every later task can report results consistently instead of inventing ad hoc alerts.
**Target Files:** `frontend/src/context/ToastContext.jsx`, `frontend/src/components/Toast.jsx`
**Branch:** `feature/13-toast-system`
**Done When:** Any component can call something like `showToast('message', 'error')`; a failed login (Task 12) and a successful/failed action can both trigger a visible, auto-dismissing toast.

---

## Task 14 — Bookmark Card Library UI
**Goal:** Build the card-based layout that fetches and displays the logged-in user's bookmarks (title, summary, tags), with "Load more" pagination.
**Target Files:** `frontend/src/components/BookmarkCard.jsx`, `frontend/src/components/BookmarkList.jsx`
**Branch:** `feature/14-bookmark-library-ui`
**Done When:** Bookmarks render as cards on the main page, wrapped in `ProtectedRoute`; a "Load more" button fetches the next page using the pagination from Task 06 and appends results.

---

## Task 15 — Edit & Delete Bookmark Actions
**Goal:** Wire the existing update/delete backend routes into the UI so users can actually manage what they've saved.
**Target Files:** `frontend/src/components/BookmarkCard.jsx` (extend), `frontend/src/components/EditBookmarkModal.jsx`
**Branch:** `feature/15-edit-delete-bookmarks`
**Done When:** Each card has edit and delete actions; delete asks for confirmation; both actions show a toast on success/failure and update the visible list without a full page reload.

---

## Task 16 — Search Bar & Tag Pill Filtering
**Goal:** Add a search input (title/text match) and clickable tag pills that filter the visible bookmark list.
**Target Files:** `frontend/src/components/SearchBar.jsx`, `frontend/src/components/TagPills.jsx`
**Branch:** `feature/16-search-filter-ui`
**Done When:** Typing in search and clicking a tag both correctly filter the rendered card list.

---

## Task 17 — Add Bookmark Form + AI Summary Display
**Goal:** Build the form to submit a new URL/note, show a loading state during the AI call, then display the returned summary/tags.
**Target Files:** `frontend/src/components/AddBookmarkForm.jsx`
**Branch:** `feature/17-add-bookmark-form`
**Done When:** Submitting the form creates a bookmark end-to-end (frontend → backend → AI → MongoDB → back to UI) with a visible loading state and toast-based error handling.

---

## Task 18 — Polish, Edge Cases, Accessibility & Deployment Prep
**Goal:** Add empty states, a basic styling pass, minimal accessibility (labels, focus states, alt text), README instructions, and production-ready auth/CORS config.
**Target Files:** `frontend/src/App.css` (or equivalent), root `README.md`, `.env.example` (final pass), `backend/server.js` (CORS lockdown)
**Branch:** `feature/18-polish-deploy`
**Done When:** App handles zero-bookmarks state gracefully; forms have labels and visible focus states; README has full setup instructions; CORS allows only the deployed frontend origin; cookies are set `secure: true` in production.

---

## Optional / Stretch Tasks (not required for v1)

### Task 19 — CI Pipeline
**Goal:** Run backend tests automatically on every push via GitHub Actions.
**Branch:** `feature/19-ci-pipeline`

### Task 20 — Forgot Password / Email Verification
**Goal:** Add password reset via emailed token (requires an email provider like Nodemailer + a transactional email service).
**Branch:** `feature/20-password-reset`

### Task 21 — Frontend Component Testing
**Goal:** Add React Testing Library coverage for key components (AddBookmarkForm, BookmarkCard, ProtectedRoute).
**Branch:** `feature/21-frontend-tests`