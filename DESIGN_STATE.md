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
`feature/Design-System` (shared for the whole redesign — see `DESIGN_PLAN.md`'s Working Agreement)

## Current Task
Task 1 — Typography Setup

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

- **Task 0 — Design Tokens & Tailwind Config:** Rewrote `frontend/src/index.css` to carry the
  full color/type/radius/shadow scale from `gistly-design-system.md` §2–§6, as plain CSS custom
  properties in `:root` (light) and a `@media (prefers-color-scheme: dark)` override block
  (dark — the "evening reading" palette, not an inversion), with a `@theme inline` block mapping
  each into Tailwind's utility namespaces. Utilities now available: colors (`bg-paper`, `text-ink`,
  `bg-surface`, `text-muted`, `text-faint`, `border-line`, `bg-accent`, `bg-accent-subtle`,
  `bg-lime`, `bg-lime-wash`, `text-coral`, `border-coral-border`), radius (`rounded-sm` 6px,
  `rounded-md` 10px, `rounded-lg` 16px, `rounded-feature` 24px — overrides Tailwind's stock
  scale), shadow (`shadow-sm`/`shadow-md`/`shadow-lg` — overrides Tailwind's stock values;
  `shadow-xl`/`shadow-2xl` left at Tailwind defaults but nothing in the design system calls for
  them), and type scale (`text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body-lg`,
  `text-body`, `text-small`, `text-micro`, each carrying its own line-height, `text-micro` also
  carrying its `0.06em` tracking). `font-sans`/`font-display`/`font-mono` mapping left as the
  Part A placeholder stack (unchanged — real font files land in Task 1).
  **Decision — spacing scale needs no custom tokens:** cross-checked design-system §4's scale
  (`space-1..space-24` = 4/8/12/16/24/32/48/64/96px) against Tailwind v4's default spacing scale
  (`--spacing: 0.25rem`, i.e. 4px increments) and confirmed they already line up exactly at every
  key the design system uses (`p-1`→4px ... `p-24`→96px). No `--spacing-*` overrides were added;
  `p-4`, `gap-6`, `mt-12`, etc. are correct out of the box.
  **Decision — concrete type-scale values chosen from the spec's ranges** (spec gives ranges, not
  single values): Display 64px, H1 40px, H2 28px, H3 20px, Body Large 18px, Body 16px, Small 14px,
  Micro 12px. Revisit any individual value if a later task's rendered composition wants the other
  end of its range — these aren't meant to be load-bearing precise, just a consistent starting
  point.
  **Open question carried forward:** `--color-surface-elevated` has no light-mode value in the
  design system (§2's dark table only) — defaulted it to equal `--color-surface` in light mode.
  Revisit if a future task (e.g. Task 12's search overlay, or dropdowns) needs a surface tone in
  light mode that's visually distinct from a plain card. Also carried forward: the dark-mode
  accent/lime/coral hex values are used as-is per the spec's default, without yet running the
  "desaturate ~10–15% if a contrast check fails against `#19191E`" check the spec calls for —
  deferred to Task 18 (Accessibility Audit Pass), where every text/background pair gets checked
  anyway; flag if any component built before then puts accent/lime/coral text directly on a dark
  surface, since that's the specific case the spec is warning about.

## Immediate Next Task
Task 1 — Typography Setup. Import `@fontsource/manrope` + `@fontsource/fraunces` (already
installed as runtime deps per Part A) into `main.jsx`, wire the real font-family stacks into the
`--font-sans`/`--font-display` custom properties in `index.css` (replacing the current fallback-
only placeholder), and apply base heading/body styles globally using the type-scale utilities
Task 0 just added (`text-h1`, `text-body`, etc.) rather than one-off sizes.

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
- **Radius/shadow scales override Tailwind's stock scales directly** (same key names — `sm`,
  `md`, `lg` — rather than new custom key names), so `rounded-lg`/`shadow-md`/etc. just work
  everywhere without a design-system-specific class name to remember (Task 0).
- **Spacing scale uses Tailwind v4's default numeric scale as-is** — no custom `--spacing-*`
  tokens — because it already matches design-system §4's px values at every key in use (Task 0).

## Established Component APIs
_(fill in as each primitive is built in Task 2 — e.g. `Button` prop signature, `Tag` prop
signature — so later tasks stay consistent instead of reinventing them)_

## Open Questions
- `--color-surface-elevated` has no defined light-mode value in the design system (dark-mode-only
  row in §2) — currently defaulted to equal `--color-surface`; revisit if a later task needs it
  distinct (Task 0).
- Dark-mode accent/lime/coral contrast-as-text-color check (spec's "desaturate ~10–15% if a
  contrast check fails against `#19191E`") not yet run — deferred to Task 18, but flag earlier if
  any task puts accent/lime/coral text directly on a dark surface before then (Task 0).
- Logo/wordmark typeface choice deferred to Task 3.