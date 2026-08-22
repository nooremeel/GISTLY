# Design Plan: Gistly "Editorial Intelligence" Redesign

Scope: frontend visual/UX redesign + incremental TS migration only. Backend feature work
lives in `PROJECT_PLAN.md`/`STATE.md` — this file and `DESIGN_STATE.md` are separate on
purpose so the two workstreams never collide in the same tracker.

## Stack (redesign-specific additions on top of PROJECT_PLAN.md's stack)
- TypeScript, migrated incrementally file-by-file as each component is redesigned (Prep Step 1)
- Tailwind CSS v4, via `@tailwindcss/vite` (registered in `vite.config.ts`) — no
  `tailwind.config.js`; config lives in `src/index.css` via `@import "tailwindcss";` + an `@theme`
  block. Colors are sourced from the existing CSS custom properties in `src/index.css` rather than
  redefined (Prep Step 3). Dark mode needs no special config — it follows the theme tokens'
  underlying CSS variables, which the existing `@media (prefers-color-scheme: dark)` block already
  overrides.
- Fonts: `@fontsource/manrope` (interface) + `@fontsource/fraunces` (display serif), self-hosted (Prep Step 4)
- Icons: `lucide-react` (Prep Step 5)

## Working Agreement
- **Single shared branch:** `feature/design-system-migration` for the entire redesign (Tasks 0–20),
  not one branch per task — this is one large cross-cutting change, per Prep Step 7. Each task below
  is a commit checkpoint on that branch, not a separate PR, unless you decide otherwise later.
- Do not start a task until the previous one is committed and `DESIGN_STATE.md` is updated.
- Each task lists: Goal, Target Files, Depends On, Done When.
- Convert touched files to `.tsx`/`.ts` as part of whichever task touches them (Constraint from the
  reusable prompt template — don't leave `any` where a real type is knowable).
- Preserve existing functional contracts (see `STATE.md`'s "Key Architectural Decisions") unless the
  task is explicitly about changing them: `err.status` convention, `{ data, total, page, pages }`
  pagination shape, `{ data }`-wrapped `getGrouped`/`getByTag` responses, no-refetch in-place state
  updates, AI fail-soft (`summary: null` is not an error).
- Accessibility requirements (design system §22) apply to every task touching UI, not just Task 18.

---

## Task 0 — Design Tokens & Tailwind Config
**Goal:** Translate the design system's color/type/spacing/radius/shadow scales into `src/index.css`'s `@theme` block (Tailwind v4 config lives in CSS, not a JS file) and update the underlying CSS variables to match.
**Target Files:** `frontend/src/index.css`
**Depends On:** Part A setup (done)
**Done When:** `bg-paper`, `text-ink`, etc. (or whatever the design system's actual token names are) are usable as Tailwind utility classes and render the correct light/dark values.

---

## Task 1 — Typography Setup
**Goal:** Import Manrope + Fraunces, wire into Tailwind's `fontFamily`, apply base heading/body styles globally.
**Target Files:** `frontend/src/index.css`, `frontend/src/main.jsx` (font imports), `frontend/tailwind.config.js`
**Depends On:** Task 0
**Done When:** Rendered headings use Fraunces, body text uses Manrope, and sizes match the design system's type scale at both desktop and the existing 1024px breakpoint.

---

## Task 2 — Core UI Primitives (Button, Input, Badge/Pill)
**Goal:** Build the shared component layer the audit flagged as missing: `Button.tsx` (all variants), `Input.tsx`/`Textarea.tsx`, `Tag.tsx`/`Badge.tsx`. Pure presentational components — no data fetching.
**Target Files:** `frontend/src/components/Button.tsx` (new), `frontend/src/components/Input.tsx` (new), `frontend/src/components/Textarea.tsx` (new), `frontend/src/components/Tag.tsx` (new, likely supersedes `TagPills.jsx`), `frontend/src/components/Badge.tsx` (new)
**Depends On:** Tasks 0–1
**Done When:** Each primitive's prop API is finalized and logged in `DESIGN_STATE.md`'s "Established Component APIs" section, since every later task depends on these exact signatures.

---

## Task 3 — App Shell & Navigation
**Goal:** Header bar + sidebar (Library/Tags/Collections), replacing the current flat `Home.jsx` layout. Includes the wordmark-only logo decision (Prep Step 8).
**Target Files:** `frontend/src/App.jsx` → `.tsx`, `frontend/src/pages/Home.jsx`, new shell/nav components
**Depends On:** Tasks 0–2
**Done When:** Shell renders with header + sidebar, routing still works, wordmark is in place, no regressions to `ProtectedRoute.jsx` behavior.

---

## Task 4 — Bookmark Card Redesign
**Goal:** Rebuild `BookmarkCard`: left-aligned layout, domain-only metadata line, tag row with overflow, collection badge, hover/selected states. Add TypeScript types for the `Bookmark` shape.
**Target Files:** `frontend/src/components/BookmarkCard.jsx` → `.tsx`, new `frontend/src/types/bookmark.ts`
**Depends On:** Tasks 0–2
**Done When:** Card matches the design system spec, `Bookmark` type is defined once and reused (not redeclared) by every later task that touches bookmark data.

---

## Task 5 — AI Gist Component
**Goal:** Extract the AI summary into its own component: label, tinted container, absent-state handling (`summary: null` renders no block), entrance animation.
**Target Files:** new `frontend/src/components/Gist.tsx`, `frontend/src/components/BookmarkCard.tsx` (integration)
**Depends On:** Task 4
**Done When:** `summary: null` renders nothing (not an empty box, not an error state) — this is the AI fail-soft contract from `STATE.md`, and this task must not weaken it.

---

## Task 6 — Loading States (Skeletons + Processing Card)
**Goal:** Skeleton bookmark cards for initial list load, plus the "processing" card variant with a Gist-mark shimmer.
**Target Files:** new `frontend/src/components/BookmarkCardSkeleton.tsx`, `frontend/src/components/BookmarkList.jsx`
**Depends On:** Tasks 4–5
**Done When:** Skeleton count/layout matches real cards closely enough to avoid layout shift; processing state is visually distinct from both skeleton and loaded states.

---

## Task 7 — Bookmark Creation Flow Redesign
**Goal:** Rebuild `AddBookmarkForm`: URL field emphasis, tag/note as secondary fields, wire in Task 6's processing state and Task 5's entrance animation on success.
**Target Files:** `frontend/src/components/AddBookmarkForm.jsx` → `.tsx`
**Depends On:** Tasks 2, 5, 6
**Done When:** Submitting a bookmark shows the processing state, then the new card enters with Task 5's animation; the `aiLimiter` 429 case (per `STATE.md`) still surfaces correctly.

---

## Task 8 — Edit Modal Redesign + Accessibility Fix
**Goal:** Rebuild `EditBookmarkModal`: focus trap, Escape-to-close, ARIA dialog attributes, shared form-field styling with Task 7's form.
**Target Files:** `frontend/src/components/EditBookmarkModal.jsx` → `.tsx`
**Depends On:** Tasks 2, 7
**Done When:** Keyboard-only user can open, edit, and close the modal without a mouse; focus returns to the triggering element on close; screen reader announces it as a dialog.

---

## Task 9 — Toast System Redesign
**Goal:** Restyle `Toast`/`ToastContext`: type-based styling (success/error/info), slide/fade transitions, `aria-live` region.
**Target Files:** `frontend/src/components/Toast.jsx` → `.tsx`, `frontend/src/context/ToastContext.jsx` → `.tsx`
**Depends On:** Tasks 0–2
**Done When:** Toasts are announced by screen readers (fixes the audit's silent-toast gap) and visually match the design system per type.

---

## Task 10 — Bookmark List + Filtering Fixes
**Goal:** Rebuild `BookmarkList` layout; fix the data-flow bug where search/tag filtering only operates on the currently-loaded page instead of the full dataset.
**Target Files:** `frontend/src/components/BookmarkList.jsx` → `.tsx`, `frontend/src/components/SearchBar.jsx`
**Depends On:** Task 4, Task 11 (for the filtering fix specifically — layout work can start earlier)
**Done When:** Searching/filtering returns correct results regardless of pagination state; pagination response shape (`{ data, total, page, pages }`) is unchanged.

---

## Task 11 — Backend Search Endpoint
**Goal:** Extend `GET /api/bookmarks` with a `search` query param, scoped by `user`, case-insensitive substring match across `title`/`note`/`url`, combined correctly with existing pagination.
**Target Files:** `backend/controllers/bookmarkController.js`, `backend/routes/bookmarks.js`
**Depends On:** none (backend-only, can run independently of frontend tasks)
**Done When:** `GET /api/bookmarks?search=foo&page=2` returns correctly filtered + paginated results, scoped to the logged-in user; existing `getBookmarks` behavior with no `search` param is unchanged. **Note:** this is a backend task — update `STATE.md`/`PROJECT_PLAN.md` conventions too, not just `DESIGN_STATE.md`, since it touches backend code outside the redesign's normal scope.

---

## Task 12 — Search Overlay (Command-K)
**Goal:** Build the ⌘K search overlay: trigger, expand animation, live results list, empty-query default content, no-results state.
**Target Files:** new `frontend/src/components/SearchOverlay.tsx`, `frontend/src/App.tsx` (keybinding)
**Depends On:** Tasks 2, 11
**Done When:** ⌘K opens the overlay from anywhere in the app, live results hit the Task 11 endpoint, Escape closes it, focus management matches Task 8's modal pattern.

---

## Task 13 — Empty States
**Goal:** All four empty-state variants (empty library, empty search, empty tag, empty collection) using the Fraunces headline treatment.
**Target Files:** new `frontend/src/components/EmptyState.tsx`, integrated into `BookmarkList.tsx`/`SearchOverlay.tsx`
**Depends On:** Tasks 1, 10, 12
**Done When:** Each of the four contexts renders its correct copy/illustration, not a shared generic message.

---

## Task 14 — Error States
**Goal:** Field-level inline errors, a full-section failure card (currently missing entirely per the audit). Confirm AI failure is never treated as an error.
**Target Files:** `frontend/src/components/AddBookmarkForm.tsx`, `frontend/src/components/EditBookmarkModal.tsx`, new `frontend/src/components/ErrorCard.tsx`
**Depends On:** Tasks 7, 8
**Done When:** A failed `GET /api/bookmarks` shows the new error card (not a blank screen); `summary: null` still never triggers any error UI, anywhere.

---

## Task 15 — Collections UI
**Goal:** First real frontend surface for the existing `getGrouped` backend endpoint: Collections nav section, per-collection view, assigning a bookmark to a collection from create/edit forms. Net-new UI, not a restyle.
**Target Files:** new `frontend/src/pages/CollectionView.tsx`, `frontend/src/App.tsx` (routing), `frontend/src/components/AddBookmarkForm.tsx`, `frontend/src/components/EditBookmarkModal.tsx`, shell nav from Task 3
**Depends On:** Tasks 3, 4, 7, 8
**Done When:** Collections appear in the sidebar with correct counts, clicking one filters to that collection's bookmarks, and a bookmark can be assigned/reassigned from both forms. `{ data: grouped }` response shape from `getGrouped` is consumed as-is, not modified.

---

## Task 16 — Mobile Responsive Pass
**Goal:** Bottom tab bar, full-width cards, bottom-sheet modals, full-screen search overlay — applied across all components built in Tasks 2–15.
**Target Files:** all components touched in Tasks 2–15
**Depends On:** Tasks 2–15
**Done When:** App is usable at mobile widths (define breakpoint per design system) with no horizontal scroll, no overlapping elements, and modals/overlay convert to full-screen/bottom-sheet per spec.

---

## Task 17 — Animation Pass
**Goal:** Apply the timing/easing system consistently: card entrance, Gist entrance (may already be done in Task 5 — this is a consistency audit), button press states, `prefers-reduced-motion` fallback for every animation added.
**Target Files:** all components with animation across Tasks 4–16
**Depends On:** Tasks 4–16
**Done When:** Every animation added during the redesign respects `prefers-reduced-motion`; timing/easing values match the design system's scale (no ad hoc durations).

---

## Task 18 — Accessibility Audit Pass
**Goal:** Dedicated pass across the finished app: contrast check (automated + manual) on every text/background pair in light and dark mode, keyboard-navigation walkthrough, focus-visible verification, icon-button `aria-label` audit.
**Target Files:** all frontend components
**Depends On:** Tasks 0–17
**Done When:** Every text/background pair meets WCAG AA in both color modes; full app is keyboard-navigable; every icon-only button has an `aria-label`.

---

## Task 19 — Auth Pages Redesign (Login/Register)
**Goal:** Apply the shell, typography (including the Fraunces supporting line from the design concept), and Task 2's form primitives to `Login.jsx`/`Register.jsx`.
**Target Files:** `frontend/src/pages/Login.jsx` → `.tsx`, `frontend/src/pages/Register.jsx` → `.tsx`
**Depends On:** Tasks 0–2 (deliberately late — low-risk, isolated, no other task depends on it)
**Done When:** Both pages match the visual system; existing auth contract (httpOnly cookie, `err.status` handling) is unchanged.

---

## Task 20 — Final QA Pass
**Goal:** Cross-check against `STATE.md`'s "must not break" list: auth contract, `err.status` handling, no-refetch update pattern, pagination contract, AI fail-soft behavior, delete confirmation.
**Target Files:** whole app (read-only verification pass; fixes go back into the relevant task's files)
**Depends On:** Tasks 0–19
**Done When:** Every item on the "must not break" list is manually re-verified against the finished redesign; `feature/design-system-migration` is ready to merge into `main`.
