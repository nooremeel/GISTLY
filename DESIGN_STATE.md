# Gistly Design System — Implementation State Tracker

Scope: frontend visual/UX redesign only ("Editorial Intelligence" system). Does not track backend
feature work — see `PROJECT_STATE.md`/`STATE.md` for that, **except** Task 11 (backend search
endpoint), which is logged here since it's part of this redesign's dependency chain even though
it touches backend code.

## Update Protocol
Same as `STATE.md`'s protocol, applied to this file: after each task, move it to Completed, update
Current Task, log deviations/decisions, note open questions. Paste this whole file + the relevant
task block from `DESIGN_PLAN.md` as the first message of each new task's chat.

## Current Active Branch
`feature/design-system-migration` (shared for the whole redesign — see `DESIGN_PLAN.md`'s Working Agreement)

## Current Task
Task 0 — Design Tokens & Tailwind Config

## Completed Tasks
- **Part A — Preparation:** Cloned repo, created `feature/design-system-migration` branch off `main`.
  Installed `typescript` (devDependency), `@types/react`/`@types/react-dom` (already present as
  devDependencies from initial scaffolding). Added `tsconfig.json` (project-references root),
  `tsconfig.app.json` (app source — `allowJs: true` so existing `.jsx` files keep compiling
  alongside new `.tsx` files during the incremental migration; `strict: true`), `tsconfig.node.json`
  (Vite config). Renamed `vite.config.js` → `vite.config.ts`. Verified clean build via
  `npx tsc -b` and `npx vite build`.
  Installed `tailwindcss@^4` + `@tailwindcss/vite@^4` (the official Vite plugin — no `postcss`,
  `autoprefixer`, or `tailwind.config.js` needed with this approach; v4 handles both internally
  and moves config into CSS). Registered the plugin in `vite.config.ts`. In `src/index.css`,
  replaced the old `@tailwind base/components/utilities;` lines with a single
  `@import "tailwindcss";` plus a `@theme inline { ... }` block that maps Tailwind's color/font
  tokens (`--color-text`, `--color-bg`, `--font-display`, etc.) to the **existing** CSS custom
  properties already declared in `:root` (`var(--text)`, `var(--bg)`, ...) rather than redefining
  them — keeps `index.css` as the single source of truth per Prep Step 3. Dark mode needs no
  special Tailwind config: because the theme tokens point at CSS variables, and the existing
  `@media (prefers-color-scheme: dark)` block in `index.css` already overrides those same
  variables, every Tailwind utility that uses them (`bg-accent`, `text-text-h`, etc.)
  automatically follows dark mode with zero extra setup. Added a placeholder `--font-sans`/
  `--font-display`/`--font-mono` mapping for Task 1 to wire up properly with real font files.
  Installed `@fontsource/manrope`, `@fontsource/fraunces`, `lucide-react` as **runtime**
  dependencies (not dev — they ship in the bundle). Verified end-to-end: a real `npx vite build`
  succeeds, and a temporary test component confirmed `bg-accent` correctly compiles to
  `background-color:var(--accent)` and `font-display` to the Fraunces stack (Tailwind v4 only
  generates CSS for classes it finds actually used in a component — an unused custom class
  producing no output is expected, not a bug).
  **Deviation from the original conversation:** started on Tailwind v3 (to match the planning
  doc's `tailwind.config.js` wording literally), then switched to v4 once confirmed to be the
  preferred/current version — no lingering v3 files remain (`tailwind.config.js` and
  `postcss.config.js` were deleted).

## Immediate Next Task
Task 0 — Design Tokens & Tailwind Config. Needs the actual `gistly-design-system.md` color/type/
spacing/radius/shadow values (only the placeholder set from `index.css` exists in the config
right now) — attach the relevant sections when starting that task's chat.

## Key Decisions
- **TypeScript migration strategy:** Incremental, file-by-file, as each component is redesigned
  (Prep Step 1). `tsconfig.app.json` has `allowJs: true` specifically to support this — tighten
  (`allowJs: false`) once every component has been converted, and note that cleanup as its own
  small task near the end if it doesn't happen naturally.
- **Tailwind version:** `^4.x`, via the official `@tailwindcss/vite` plugin — no
  `tailwind.config.js` or separate PostCSS setup. Config lives in `src/index.css` via `@import
  "tailwindcss";` + an `@theme` block. (Briefly considered pinning to v3 to match the original
  planning doc's `tailwind.config.js` wording literally, but v4 is the current, actively developed
  version, so switched before Task 0 built anything real on top of it.)
- **Color source of truth:** `src/index.css`'s CSS custom properties, mapped into Tailwind via
  `var(--x)` rather than duplicating hex values in `tailwind.config.js` (Prep Step 3, option
  recommended in the plan).
- **Dark mode strategy:** `darkMode: 'media'` — matches the existing `prefers-color-scheme`
  approach, no manual toggle (Prep Step 3).
- **Font loading:** Self-hosted via `@fontsource/manrope` + `@fontsource/fraunces` (Prep Step 4).
  Not yet imported anywhere — that's Task 1.
- **Icon library:** `lucide-react` (Prep Step 5).
- **Search fix approach:** Backend endpoint added (Task 11 included in `DESIGN_PLAN.md`), not
  deferred (Prep Step 6).
- **Logo/wordmark approach:** Not yet decided beyond "wordmark-only, low-risk" default from the
  original planning doc — confirm typeface choice (Fraunces vs. Manrope Bold) at Task 3.
- **Branching model:** One shared branch (`feature/design-system-migration`) for all 21 tasks,
  not one branch per task like `PROJECT_PLAN.md`'s backend convention — this is a single
  cross-cutting change (Prep Step 7).

## Established Component APIs
_(fill in as each primitive is built in Task 2 — e.g. `Button` prop signature, `Tag` prop
signature — so later tasks stay consistent instead of reinventing them)_

## Open Questions
- Task 0 needs the actual design-system token values (color palette, type scale, spacing scale,
  radius scale, shadow scale) from `gistly-design-system.md` — that file wasn't part of what's in
  this repo yet; attach it (or the relevant sections) when starting Task 0's chat.
- Logo/wordmark typeface choice deferred to Task 3.
