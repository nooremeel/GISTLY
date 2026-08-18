# Bookmark Manager

Full-stack bookmark manager with AI-generated summaries and tags (Google Gemini).

## Stack
- Backend: Express 5, MongoDB/Mongoose, JWT auth (httpOnly cookies)
- Frontend: React (Vite), react-router-dom
- AI: Gemini API (`gemini-3.5-flash-lite`)

## Setup

### Backend
```bash
cd backend
npm install
cp ../.env.example ../.env   # fill in MONGODB_URI, GEMINI_API_KEY, JWT_SECRET
npm run dev
```
Runs on `http://localhost:5000`.

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Runs on `http://localhost:5173`.

### Tests
```bash
cd backend
npm test
```
Uses an in-memory MongoDB (`mongodb-memory-server`) — no real database needed.

## Environment Variables

**Root `.env`** (backend):
| Var | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `GEMINI_API_KEY` | Google Gemini API key |
| `JWT_SECRET` | Secret for signing JWTs |
| `PORT` | Backend port (default 5000) |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), comma-separated for multiple |
| `NODE_ENV` | `development` or `production` — controls cookie `secure` flag |

**`frontend/.env`**:
| Var | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend base URL |

## Deployment Notes
- Set `NODE_ENV=production` on the backend so auth cookies are issued with `secure: true`.
- Set `CLIENT_ORIGIN` to your deployed frontend's exact origin (no trailing slash). Comma-separate multiple origins if you have staging + prod.
- No CSRF token protection is implemented yet — auth relies on `SameSite=Lax` cookies. Known gap; consider adding CSRF tokens before handling sensitive mutations at scale.

## Known Limitations
- Near-duplicate tags (e.g. "Node.js" vs "NodeJS") aren't deduped, only exact case-insensitive matches.
- No CI pipeline or frontend automated tests yet.
- Tag pills are derived only from currently-loaded bookmarks (pre-"Load more" pages won't show all tags until loaded).