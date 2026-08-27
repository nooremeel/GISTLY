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
**Naming note:** `DESIGN_PLAN.md`'s Working Agreement and this file's own "Key Decisions" section
both refer to this branch as `feature/design-system-migration`, but the actual branch already in
use (Tasks 0–2's commits are on it) is `feature/Design-System`. Not renaming it now — that would
touch remote tracking/PR state outside this task's scope — but flagging so future tasks paste the
right branch name and don't assume a second, different branch exists.

## Current Task
Task 15 — Collections UI

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

- **Task 1 — Typography Setup:** Wired real font stacks into `--font-sans`/`--font-display`
  (`@theme inline` block, `index.css`) and imported `@fontsource/manrope` (400/500/600) +
  `@fontsource/fraunces` (500 only — the only weight the design system currently calls for) in
  the app entry. Replaced the ad hoc `h1`/`h2` rules (56px/24px, negative letter-spacing) with
  Task 0's `text-h1`/`text-h2`/`text-h3` tokens, added a global `h3` base style (previously
  unstyled), and switched heading color/font-family from the legacy `--heading`/`--text-h`
  variables to `--font-sans`/`--color-ink`. Updated the base body rule to Task 0's
  `text-body`/`text-body--line-height` instead of the old `18px/145%`, and switched `color`/
  `background` to `--color-muted`/`--color-paper`. Also updated the legacy `--sans`/`--heading`
  variables (still consumed by these same rules) to the real Manrope stack, matching
  `--font-sans`.
  **Deviation:** `main.jsx` → `main.tsx` (not just edited in place) — the migration constraint
  requires converting touched files to TypeScript as part of whichever task touches them; this
  file needed no real type annotations beyond what `createRoot` infers, so it's a rename + font
  imports, not a rewrite. `index.html`'s `<script type="module" src="/src/main.jsx">` updated to
  `main.tsx` to match.
  **Deviation:** the plan's target-file list included `frontend/tailwind.config.js` for this
  task — that file doesn't exist under the v4/`@tailwindcss/vite` approach (config lives in
  `index.css`, per Part A's decision), so there was nothing to do there. Carrying this forward
  as a standing note: any future task-plan reference to `tailwind.config.js` is stale and should
  be read as "the relevant `@theme` block in `index.css`."
  **Fix (Part A gap, not a Task 1 deviation):** added the missing `frontend/src/vite-env.d.ts`
  (`/// <reference types="vite/client" />`) — never created when the TS config files were added
  in Part A. Invisible until now because `main.jsx` wasn't type-checked (`checkJs: false`); once
  it became `main.tsx` for this task, `noUncheckedSideEffectImports` (already on in
  `tsconfig.app.json`) needed it to accept the CSS side-effect imports (`import './index.css'`,
  the four `@fontsource/*.css` imports). Verified via a real `npx tsc -b --noEmit` against the
  cloned repo: reproduced the exact `TS2882` error with the file absent, confirmed it resolves
  cleanly with just this one file added and nothing else changed.
  **Decision (needs a real-browser check, not just spec-derived):** dropped the old
  `@media (max-width: 1024px)` font-size shrinks on `body`/`h1`/`h2` and the old negative
  letter-spacing on headings (`-1.68px`, `-0.24px`) and body (`0.18px`). Both were tuned to the
  pre-redesign default sans stack; the design system's type scale (§3) gives fixed sizes with no
  separate tablet step, and Manrope's metrics don't obviously need extra tracking. Flagging
  rather than asserting this is final — if headings/body read too loose/tight at 1024px width in
  the actual running app, the fix is scoped to this one rule block, not a scale change.

- **Task 2 — Core UI Primitives (Button, Input, Badge/Pill):** Built five pure presentational
  components, no data fetching, no form logic: `frontend/src/components/Button.tsx`,
  `Input.tsx`, `Textarea.tsx`, `Tag.tsx`, `Badge.tsx`. Also added two small shared-code files:
  `frontend/src/lib/cx.ts` (a ~3-line className combinator — written locally instead of adding
  `clsx`/`cva` as a new dependency, since nothing here needs more than filtering falsy values)
  and `frontend/src/components/formField.ts` (style-fragment constants shared by `Input`/
  `Textarea` so the two can't visually drift from each other over time).
  Every component reads its colors/radius/shadow/type/spacing exclusively from Task 0/1's
  `@theme` tokens (`bg-ink`, `text-accent`, `rounded-md`, `text-small`, etc.) — no new ad hoc
  values introduced anywhere.
  **Bug found and fixed (blocking — not a Task 2 target file, but required for Task 2's own
  deliverables to render at all):** the TEMPORARY placeholder block at the bottom of
  `frontend/src/index.css` (styling bare `input`/`textarea`/`select`/`button` elements) was
  written as plain, unlayered CSS. Tailwind v4 emits all of its own utility classes inside CSS
  cascade layers (`@layer theme, base, components, utilities`), and per the cascade-layers spec,
  *unlayered* CSS always wins over *any* layered CSS regardless of selector specificity. That
  meant the placeholder's element-selector rules were silently beating every Tailwind utility
  class applied to a real `<button>`/`<input>`/`<textarea>` — including the new primitives
  themselves, which render as actual `<button>`/`<input>`/`<textarea>` elements with Tailwind
  classNames. Confirmed empirically before fixing: built a throwaway smoke-test page rendering
  all five primitives, ran a real `npx vite build`, and screenshotted it (Playwright/Chromium) —
  every `Button` variant rendered pale gray instead of its spec'd color; computed
  `background-color` traced back to the placeholder's `background: var(--code-bg)` rule, not the
  `bg-ink`/`bg-accent`/etc. utility class that was correctly present in the compiled CSS and
  correctly targeting the element. Fix: wrapped the placeholder block in `@layer base { ... }`
  (one contained edit to `index.css`, nothing deleted or restructured). Rebuilt, retook the
  screenshot (light + dark, plus keyboard-focus and active-tag states) — all five primitives now
  render exactly per spec in both palettes. This block otherwise stays as-is (still styling
  not-yet-migrated raw elements in `AddBookmarkForm`, `EditBookmarkModal`, `Login`, `Register`,
  `SearchBar`) — deleting it is still gated on every one of those being migrated to the new
  primitives in their own later tasks (7, 8, 9, 19), per the plan's existing sequencing. Comment
  in `index.css` updated to explain both the original stopgap purpose and this layering fix, so a
  future task doesn't accidentally revert it back to unlayered CSS.
  **Decision — `Tag` is one component, not two:** renders as a `<span>` for static display (a
  bookmark card's tag row) or a `<button>` when given an `onClick` (toolbar filter pills), same
  visual treatment either way. Avoids needing `TagDisplay`/`TagButton` as separate components for
  what's one design element in §12. `TagPills.jsx` is left untouched for now — swapping its
  callers over to `Tag` is Task 10's job (Bookmark List + Filtering Fixes touches `SearchBar.jsx`
  where the filter pills actually live), not Task 2's.
  **Decision — `Input`'s size prop is named `sizeVariant`, not `size`:** `size` is already a
  native `<input>` HTML attribute (number of visible characters) that the component forwards
  through `...rest`; reusing the name for the `default`/`lg` visual variant from §8 would have
  collided with it.
  **Decision — `Button`'s `loading` prop is reserved for AI-triggering actions specifically**
  (renders the pulsing Gist-mark/Sparkles motif per §7/§16), not a generic "any async action"
  loading flag. For non-AI async actions (Login, Save edit, Delete) §16 calls for a plain
  disabled state + text swap instead — callers handle that themselves by passing `disabled` and
  swapping `children`, rather than setting `loading`.
  **Open question (not blocking, flagging for later):** `frontend/eslint.config.js`'s `files`
  glob is still `**/*.{js,jsx}` only — it's never covered `.ts`/`.tsx` files, going all the way
  back to Part A/Task 1's `main.tsx` rename. Every file this task added is therefore currently
  unlinted (`npx eslint` reports "File ignored because no matching configuration"). Didn't fix it
  here since it's a project-wide tooling gap spanning every task's `.tsx` output so far, not
  something specific to Task 2's scope — but it's been silently true since Task 1 and is worth a
  small dedicated fix (extend the `files` glob, add `typescript-eslint`) sooner rather than at the
  Task 18 cleanup pass, since it'll only get noisier the more `.tsx` files accumulate.
  Verified via real tool runs, not just a read-through: `npx tsc -b --noEmit` (clean), `npx vite
  build` (clean, confirmed `bg-ink`/`rounded-md`/etc. present in compiled CSS), and the
  screenshot-based smoke test described above (light mode, dark mode, keyboard-focus ring on
  `Input`, active/pressed state on `Tag`).

- **Task 3 — App Shell & Navigation:** Built the header + sidebar shell (§13) and wired it in as a
  layout route: `frontend/src/components/AppShell.tsx` (new — `Outlet`-based wrapper, mounted
  inside `ProtectedRoute` in `App.tsx` so `user` is guaranteed by the time it renders),
  `Header.tsx` (new — wordmark, header search field, "+ Add", `AccountMenu`), `Sidebar.tsx` (new
  — Library/Tags/Collections nav; Tags and Collections render as inert "Soon"-badged rows since
  neither has a page yet), `AccountMenu.tsx` (new — replaces the old bare "Logged in as ...
  Logout" text strip; self-contained open/close state, closes on outside-click and Escape,
  returns focus to the trigger on close). `App.tsx` updated to nest the authenticated route inside
  `AppShell`. `Home.tsx` simplified now that login-status text and the logout button live in
  `AccountMenu`; kept its `/api/health` check and existing `AddBookmarkForm`/`BookmarkList`
  wiring unchanged, added an `id="add-bookmark"` anchor section so the header's "+ Add" button has
  something real to scroll to (see `Header.tsx`'s comment — a working affordance, not a dead
  button, until Task 7's proper flow).
  **Wordmark typeface — resolved (Prep Step 8's open question):** Manrope semibold (`font-sans`,
  `text-h3`), not Fraunces. §3 is explicit that the display serif is reserved for a short,
  named list of genuinely editorial moments (first-run empty state, auth pages' supporting line)
  and "never in functional UI" — the header wordmark, sitting in the shell's permanent chrome, is
  functional UI by that definition, and §1's "chrome stays quiet" principle points the same
  direction. Treating this as decided; revisit only if a future task finds a concrete reason
  Fraunces reads better there in practice.
  **Bug found and fixed (blocking — not a Task 3 target file, but required for the shell to
  actually render full-width per §13, same category as Task 2's cascade-layers fix):**
  `frontend/src/index.css`'s `#root` rule — `width: 1126px; margin: 0 auto; border-inline: 1px
  solid var(--border); text-align: center` — predates the redesign (preserved as-is through Tasks
  0–2 per the Task 0 incident note) and was written for the old single-page, centered app. It was
  silently clipping the new header/sidebar shell to that same centered 1126px framed column
  instead of letting it span the viewport. Confirmed empirically, not just by inspection: built a
  real `npx vite build`, served it, and sampled pixel colors on a Playwright screenshot at a
  1280px viewport — the header's surface color stopped dead at x=78/x=1201 with visible
  border-inline hairlines at x=77/x=1202, confirming the shell was rendering inside the old frame.
  Fix: removed the width/margin/border-inline/text-align from `#root` (now a plain full-height
  flex container) and moved those exact declarations into a new `.legacy-page-frame` class,
  applied via a wrapper `<div>` in `Login.jsx` and `Register.jsx` only — the two pages that still
  depend on this framing and aren't redesigned until Task 19. Re-verified after the fix: same
  pixel-sampling method now shows the header's surface color spanning the full viewport width
  edge-to-edge with no border artifacts, while a fresh screenshot of `/login` at the same 1280px
  viewport shows the border-inline hairlines at the exact same x=77/x=1202 positions as before the
  fix — Login/Register's rendered output is unchanged.
  **Decision — `Login.jsx`/`Register.jsx` stay `.jsx`, not renamed to `.tsx`, despite being
  touched:** the touch here is a single wrapper `<div className="legacy-page-frame">` with no
  logic or prop changes — no real type annotation need, unlike `main.jsx`'s Task 1 rename which
  had the same "trivial touch" shape. Diverging from that precedent here because Task 19's target
  file list already explicitly names `Login.jsx → .tsx` / `Register.jsx → .tsx` as its own
  deliverable (full redesign + conversion, sharing Task 2's form primitives) — doing a bare rename
  now would fragment that task's target files without doing any of the actual typing work, for no
  benefit. Flagging this as a considered exception, not an oversight, in case a later task expects
  every touched file to already be `.tsx` by this point.
  **Decision — `Header.tsx`'s search field is a real but inert `Input`, not built out:** disabled,
  `title="Search is coming soon"`, no local filtering logic. Task 12 (⌘K overlay) depends on Task
  11's backend search endpoint; building working client-side search here would mean writing logic
  that gets thrown away once Task 12 lands.
  **Verified via real tool runs:** `npx tsc -b --noEmit` (clean), `npx vite build` (clean),
  Playwright screenshots (light mode, dark mode, mobile width/390px, account-menu open state,
  keyboard focus-visible ring on the sidebar's active nav item) confirming layout, dark-mode
  palette, and §22 focus-ring requirements all render correctly; a live-server pixel-sampling
  check (described above) confirming the `#root` fix and Login/Register's unchanged framing.
  
  - **Task 4 — Bookmark Card Redesign:** Rewrote `frontend/src/components/BookmarkCard.jsx` →
  `.tsx` per §10/§11/§12, and added `frontend/src/types/bookmark.ts` (new — the shared
  `Bookmark` interface every later task should import rather than redeclare).
  Left-aligned layout; domain-only metadata line (`getDomain()` — parses via `URL`, strips
  `www.`, falls back to `null` on anything unparseable rather than showing a mangled string);
  H3 title as the card's heaviest element; inline Gist block (Sparkles + `GIST` label in
  `text-micro`/accent, `bg-lime-wash` container, `radius-md`, `space-4` padding — the wash
  variant from §11's two options, not the left-border alternative, see decision below); user
  note rendered separately/subordinate below it; tag row capped at 4 visible tags + a `+N`
  overflow `Tag` (`noPrefix`); collection as a `Badge`; relative timestamp (`3m ago` style,
  local `formatRelativeTime()` helper). Actions (Edit/Delete) are hover-*and*-keyboard-focus-
  revealed compact icon buttons (`Pencil`/`Trash2` from `lucide-react`, `Button` `ghost`/
  `destructive` `compact` variants, both with `aria-label`) rather than a `⋯` overflow menu —
  see decision below. Hover state: `-translate-y-0.5` + `shadow-sm` + `border-accent/30`, all
  under a single `motion-reduce:transition-none` (final hover state still applies instantly
  under reduced motion, per §21 — only the animation is dropped, not the state change).

  **Bug found and fixed (blocking — not a Task 4 target file, but required for this task's
  own deliverable to type-check at all, same category as Task 2's/Task 3's "found and fixed"
  notes):** `useToast()` (`context/ToastContext.jsx`) type-resolves to `never` for any
  consumer under `strict` — `createContext(null)` plus the hook's `if (!ctx) throw ...; return
  ctx` guard narrows the only possible type (`null`) away, leaving `never`, so
  `showToast(...)` doesn't type-check as callable. Confirmed via a real `npx tsc -b --noEmit`
  reproducing `TS2349` on both `showToast` calls. This is squarely Task 9's file ("Toast
  System Redesign") — not touching it here. Fix is scoped entirely to `BookmarkCard.tsx`: a
  local `ShowToast` type alias and a cast on the hook's return value
  (`useToast() as { showToast: ShowToast }`), matching `showToast`'s actual runtime signature
  (`context/ToastContext.jsx`'s `showToast(message, type = 'info', duration = 3500)`). Nothing
  in `ToastContext.jsx` itself changed. Flagging so Task 9 knows this `never`-typing issue
  exists and can fix it at the source (e.g. a typed context value / non-null default) rather
  than being surprised other files have worked around it locally.

  **Decision — Gist container uses the background-wash treatment, not the left-border
  alternative:** §11 offers both ("test both... wash reads more 'highlighted', left-border
  reads more 'editorial annotation'") without picking one. Went with the wash
  (`bg-lime-wash`, already defined as a token) since it's the higher-visibility option and
  the Gist is explicitly called out as "the single most visually distinct element on a card"
  (§1) — revisit if Task 5's dedicated pass finds the left-border reads better once it's the
  Gist's own component with more surrounding chrome to distinguish it.

  **Decision — hover-revealed Edit/Delete icon buttons, not a `⋯` overflow menu:** §10 offers
  both as acceptable ("move into a `⋯` overflow menu or become hover-revealed"). Picked the
  buttons because a `⋯` menu needs its own popover/keyboard-nav/dismiss-on-outside-click
  implementation (the same category of work as `AccountMenu.tsx`) that isn't otherwise in this
  task's scope, while two compact icon buttons reuse `Button` as-is and still satisfy the
  "not two permanently-visible buttons at the bottom of every card" requirement by being
  hover/focus-revealed. Both buttons carry `aria-label`s per §22's icon-only-button rule.
  Revisit if a future task (e.g. once more per-card actions exist) wants the overflow-menu
  version instead.

  **Decision — domain line only renders alongside a real title, not standalone:** if
  `bookmark.title` is empty, the H3 headline itself falls back to the domain (or, failing
  that, the raw `url`, or finally `"Untitled bookmark"`) rather than showing the domain twice
  (once as the H3 fallback, once as the metadata line). Slightly different from the original
  file's fallback chain (`title || url`) — now `title || domain || url || 'Untitled bookmark'`
  — a deliberate visual improvement (domain reads cleaner than a raw URL as a heading) that's
  within this task's scope, not a functional-contract change.

  **Decision — Gist stays inline in `BookmarkCard.tsx`, not extracted to `Gist.tsx` yet:**
  Task 5 ("AI Gist Component") is explicitly scoped as the extraction task, including the
  entrance animation. Building it inline here (matching §11's visual spec exactly, just not
  yet its own file) avoids Task 4 doing part of Task 5's job and leaves Task 5 a clean,
  well-defined "extract + animate" scope instead of "extract + animate + also fix the visual
  spec."

  **Verified via real tool runs:** `npx tsc -b --noEmit` (clean), `npx vite build` (clean).
  Playwright screenshots against a temporary smoke-test entry (mounting `BookmarkCard`
  directly with mock data covering: a normal bookmark with title/url/note/summary/5 tags; a
  no-title bookmark with url+collection only, no summary — `summary: null` case; a note-only
  bookmark with no url and no title) — confirmed light mode, dark mode, mouse-hover state
  (actions fade in, border/shadow lift), and **keyboard-focus state** (Tab lands on the Edit
  button; actions become visible via `group-focus-within`, not just `group-hover` — confirms
  the hover-reveal doesn't strand keyboard users, per §22). Smoke-test files (`smoke.html`,
  `src/smoke-main.tsx`) were temporary and deleted after verification — not part of the
  actual deliverable.

  - **Task 5 — AI Gist Component:** Extracted the inline Gist block from `BookmarkCard.tsx` into
  its own `frontend/src/components/Gist.tsx` (new), and wired `BookmarkCard.tsx` to import and
  render `<Gist summary={bookmark.summary} />` in place of the former inline JSX.

  **`Gist.tsx` API:**
  ```ts
  summary: string | null | undefined;  // renders nothing when null/undefined/empty — fail-soft contract
  animate?: boolean;                    // default false; set true for freshly created bookmarks (Task 7)
  className?: string;                   // forwarded to the outer div for one-off layout tweaks
  ```

  **Entrance animation:** `@keyframes gist-enter` added to `index.css` (fade: opacity 0→1,
  expand: max-height 0→600px, padding-top/bottom 0→1rem) in a plain `@keyframes` block
  (outside any layer — keyframes don't participate in the cascade-layers system). The
  `.animate-gist-enter` class emitting `animation: gist-enter 300ms cubic-bezier(0.22, 1, 0.36, 1)
  both` plus `overflow: hidden` is placed in `@layer utilities` so it sits at the same cascade-
  layer priority as Tailwind's own utilities and doesn't need specificity tricks to coexist with
  them. The reduced-motion override (`@media (prefers-reduced-motion: reduce) { .animate-gist-enter
  { animation: none } }`) is inside the same `@layer utilities` block — the block still *appears*
  at its final opacity/height instantly; the state change is never removed, per §21's requirement.

  **Implementation note — `animate` prop is not yet wired up:** `BookmarkCard` passes no `animate`
  prop (correctly — listed bookmarks have summaries already loaded; no entrance animation should
  play). The prop exists and is documented for Task 7 (Bookmark Creation Flow), which will
  optimistically insert a processing card into the list and then flip it to a real `BookmarkCard`
  with `<Gist animate>` once the AI summary arrives. This task correctly scopes only the
  extraction + animation infrastructure, not the Task 7 wiring.

  **`BookmarkCard.tsx` changes:** removed the inline Gist JSX block (9 lines → 1 line);
  removed the now-unused `Sparkles` import; added `import Gist from './Gist'`; updated the
  JSDoc comment to reflect the extraction.

  **No new dependencies, no new design tokens:** the `@keyframes` uses the exact
  `cubic-bezier(0.22, 1, 0.36, 1)` value from §21 written literally in the keyframe (no new token;
  a `@property` approach was attempted and immediately reverted — `@property` applies to typed CSS
  custom properties like lengths/colors, not to string aliases for easing curves; the literal value
  is the correct approach here, consistent with how `--shadow-sm`/etc. work). The max-height
  approach for the height animation is the standard CSS workaround for the `height: auto`
  un-transitionability; 600px is a safe upper bound for any realistic Gist summary.

  **Verified via real tool runs:** `npx tsc -b --noEmit` (clean, exit 0), `npx vite build` (clean,
  exit 0, 806ms). Confirmed the compiled CSS contains: `@keyframes gist-enter` (correct from/to
  keyframes), `.animate-gist-enter` with the correct `animation:` shorthand, and the
  `prefers-reduced-motion` override — all present in the production bundle.

  - **Task 6 — Loading States (Skeletons + Processing Card):** Three new files shipped:
  `frontend/src/components/BookmarkCardSkeleton.tsx` (new — pure skeleton, default export only),
  `frontend/src/components/ProcessingCard.tsx` (new — separate file per user decision; shows
  known bookmark data + pulsing Gist placeholder while AI generates the summary),
  `frontend/src/index.css` (modified — `@keyframes shimmer` + `.animate-shimmer` utility in
  `@layer utilities`). `BookmarkList.jsx` minimally touched: `BookmarkCardSkeleton` import added,
  the bare `<p>Loading bookmarks...</p>` early return replaced with 3 skeleton cards in an
  `aria-busy` container.

  **`BookmarkCardSkeleton`:** same outer shell as `BookmarkCard` (`rounded-lg border border-line
  bg-surface p-6`) to prevent layout shift on load. Placeholder bars are `rounded-sm
  animate-shimmer` `<div>`s sized to approximate typical card content rows (domain, 2-line title,
  Gist block, tag row). The whole card is `aria-hidden="true"`; the list wrapper carries
  `aria-busy="true" aria-label="Loading your bookmarks"` so screen readers hear one meaningful
  announcement, not three meaningless skeleton descriptions.

  **`ProcessingCard`:** shows real title/domain/tags/collection immediately. In the Gist slot:
  lime-wash container (matching `Gist.tsx`'s container dimensions for stable height), pulsing
  `Sparkles` icon (`animate-pulse motion-reduce:animate-none` — the same Gist-mark motif as
  `Button`'s loading state per §7/§16), label text `"Reading the page & forming a gist…"` in
  `text-micro text-muted`, plus two shimmer bars hinting at incoming text. The container carries
  `role="status" aria-label="Gist is being generated"` (§22 — no color-only signaling). The card
  itself carries `aria-busy="true"` and `aria-label` with the bookmark title. `ProcessingBookmark`
  type exported separately for Task 7 to consume.

  **Shimmer animation:** `@keyframes shimmer` (background-position sweep -200% → 200%) +
  `.animate-shimmer` in `@layer utilities` (linear-gradient using `--line`/`--surface-elevated`
  tokens — works in both light and dark mode automatically). 1.6s `ease-in-out` per §16's "calm
  thinking" instruction. Reduced-motion: `animation: none; background: var(--line)` — bar still
  renders at resting color, no motion.

  **`ProcessingCard` not yet wired into `BookmarkList.jsx`:** the visual components are ready;
  the wiring (Task 7's job) is when `AddBookmarkForm` calls `addBookmark` with a processing-shaped
  object and then swaps it with the real card once the server responds. `BookmarkList.jsx`'s
  `addBookmark` imperative handle is deliberately left unchanged — it already accepts any object
  into the `bookmarks` array; Task 7 will manage the processing/real distinction at the form level.

  **Decision — `ProcessingCard` in its own file (`ProcessingCard.tsx`):** user's preference;
  overrode the co-location argument (ProcessingCard and BookmarkCardSkeleton are tightly coupled
  as "non-real card states") in favor of navigability (one component per file is the dominant
  React convention and easier for beginners to find). The coupling argument wasn't strong enough
  to insist.

  **Verified via real tool runs:** `npx tsc -b --noEmit` (clean, exit 0), `npx vite build`
  (clean, exit 0, 731ms). Confirmed in compiled CSS: `@keyframes shimmer` (correct from/to
  keyframes), `.animate-shimmer` with linear-gradient and `1.6s ease-in-out infinite shimmer`,
  reduced-motion override (`background: var(--line); animation: none`) — all present in the
  production bundle.

  - **Task 7 — Bookmark Creation Flow Redesign:** Rebuilt `AddBookmarkForm.jsx` → `AddBookmarkForm.tsx`
  using Task 2's `Input`/`Textarea`/`Button` primitives. URL field first with `sizeVariant="lg"`
  (h-12, Body Large) separated from secondary fields (title, note, tags, collection) by a
  `gap-8` break and a soft divider line. Submit button is `Button` `primary` `loading={isLoading}`
  (Sparkles pulse during AI processing). `lastResult` preview block removed — the `ProcessingCard`
  in the list is the feedback now.

  **Processing→real card swap wiring:**
  - `AddBookmarkForm` calls `onProcessing(processingBookmark)` immediately on submit (before API)
    so the caller can prepend a `<ProcessingCard>` optimistically.
  - `AddBookmarkForm` calls `onCreated({ ...bookmark, _tempId, _animateGist: true })` when the
    API responds, so the caller can swap the ProcessingCard for a real `BookmarkCard`.
  - `BookmarkList.jsx` gained a `replaceBookmark(tempId, real)` imperative handle method and a
    runtime `bookmark._processing` check in its map to render `<ProcessingCard>` vs `<BookmarkCard>`.
  - `BookmarkCard.tsx` gained an `animateGist?: boolean` prop forwarded to `<Gist animate>`—
    this is where Task 5's entrance animation finally fires for the first time.
  - `Home.tsx` wires the two callbacks to the imperative handle; `BookmarkListHandle` type
    tightened from `addBookmark: (bookmark: unknown)` to proper `ProcessingBookmark`/`Bookmark`
    shapes with the client-side-only fields.
  - `ProcessingCard.tsx`'s `ProcessingBookmark` type updated to include `_processing: true`
    as a required discriminant field.

  **Functional contracts preserved:**
  - `err.status === 429` → rate-limit toast unchanged.
  - Client-side "url or note required" guard still runs before any API call.
  - No-refetch in-place state update: `addBookmark` + `replaceBookmark` on the imperative handle,
    no `fetchPage` called.
  - `summary: null` fail-soft: if AI fails, the ProcessingCard is still replaced with a real
    `BookmarkCard` — it just renders without a Gist block. No error state.

  **API failure handling decision:** on API failure, a toast fires but the `ProcessingCard` stays
  in the list (stuck, no resolution). This is a known gap noted in the code comment — Task 14
  (Error States) can revisit with a proper error card treatment. The simplest fix would be
  calling `replaceBookmark` with `null` to remove it, but that would require `BookmarkList` to
  handle a null slot, which is out of Task 7's scope.

  **`AddBookmarkForm.jsx` kept alongside `.tsx`:** the old `.jsx` file was not deleted since
  nothing in the current import graph references it by name (all imports went through bare
  `'./AddBookmarkForm'` which Vite resolves to `.tsx` first). Flagging: the `.jsx` file should
  be deleted to avoid confusion. Can be done with a one-liner at the next git commit.

  **Collection reminder:** user flagged they may want to remove collections from the backend
  entirely after the redesign is complete, since tags may be sufficient. Noted here to revisit
  after Task 20 (Final QA Pass). Do not remove until that decision is made — Task 15
  (Collections UI) is still planned and would make the decision easier to evaluate with a
  working UI.

  **Verified:** `npx tsc -b --noEmit` (clean, exit 0), `npx vite build` (clean, exit 0, 572ms).

  - **Task 8 — Edit Modal Redesign + Accessibility Fix:** Rebuilt
  `EditBookmarkModal.jsx` → `.tsx` (new file alongside the old `.jsx`—see
  deviation note below). Full §18/§22 accessibility pass: focus trap
  (Tab/Shift+Tab trapped within the panel via `document.addEventListener`
  on mount/unmount cycle), Escape-to-close (same pattern), scrim
  click-to-close, `role="dialog"` + `aria-modal="true"` +
  `aria-labelledby` tying the heading to the dialog role. Focus moves to
  the first focusable field on open; returns to the triggering Edit button
  on close via the new `triggerRef` prop.

  **Portal rendering (blocking fix):** rendered via
  `ReactDOM.createPortal` to `document.body`. This is required — not a
  preference — because bookmark cards use CSS `transform` on hover, which
  creates a new CSS containing block for `position: fixed` children; any
  `fixed`-position overlay rendered *inside* the card article would be
  clipped to the card's own bounds rather than the viewport. Portalling
  out sidesteps the containing-block issue entirely without fighting
  z-index stacking contexts.

  **Form fields:** all five fields (Title, URL, Note, Tags, Collection)
  use Task 2's `Input`/`Textarea` primitives. Same `gap-4` vertical
  rhythm as `AddBookmarkForm`'s secondary fields. Footer uses Task 2's
  `Button` (Secondary "Cancel" + Primary "Save") right-aligned per §18.

  **Save is non-AI → disabled + text swap, not `loading` prop:** §16
  explicitly distinguishes AI-triggering actions (Add Bookmark, which gets
  the pulsing Gist-mark pulse via `loading={true}`) from non-AI actions
  (Save edit, Login, Delete, which get plain `disabled` + swapped
  `children`). Save is in the second category — matching the original
  file's own `'Saving…'` text swap.

  **Entrance animation:** two new `@keyframes` in `index.css`:
  `modal-scrim-enter` (opacity 0→1) and `modal-panel-enter` (opacity +
  scale 0.96→1), both 200ms, design-system easing
  (`cubic-bezier(0.22, 1, 0.36, 1)`). Applied via `.animate-modal-scrim`
  and `.animate-modal-panel` utility classes in `@layer utilities`
  (same pattern as `.animate-gist-enter`/`.animate-shimmer`). Both have
  `prefers-reduced-motion: reduce` overrides in the same layer block:
  `animation: none` — state still resolves to final values, only motion
  is removed, per §21.

  **`BookmarkCard.tsx` updated:** added `useRef<HTMLButtonElement>` for
  the Edit button (`editBtnRef`) and passed it as `triggerRef` to
  `EditBookmarkModal`. `Button` already uses `forwardRef` (Task 2), so
  this required only adding `ref={editBtnRef}` to the Edit `<Button>`.

  **`index.css` comment updated:** removed `EditBookmarkModal` from the
  temporary placeholder block's "remaining unmigrated" list; it's now
  migrated. Remaining: Login, Register, SearchBar.

  **Deviation — `.jsx` file left alongside `.tsx`:** same as
  `AddBookmarkForm`'s Task 7 deviation (the old `.jsx` was not deleted;
  Vite resolves the bare `'./EditBookmarkModal'` import to `.tsx` first).
  Flagging: delete `EditBookmarkModal.jsx` at the next git commit to
  avoid confusion — a one-liner cleanup, not a separate task.

  **`useToast()` cast:** same scoped `as { showToast: ShowToast }` cast
  as `BookmarkCard.tsx`/`AddBookmarkForm.tsx`. Task 9 (Toast System
  Redesign) is the file that owns the real fix.

  **Verified:** `npx tsc -b --noEmit` (clean, exit 0), `npx vite build`
  (clean, exit 0, 784ms). Confirmed in compiled CSS: `@keyframes
  modal-scrim-enter` + `modal-panel-enter` (correct from/to keyframes),
  `.animate-modal-scrim` + `.animate-modal-panel` with the correct
  `animation:` shorthands, and the `prefers-reduced-motion` override for
  both — all present in the production bundle.

  - **Task 9 — Toast System Redesign:** Rebuilt `Toast.jsx` → `.tsx` and
  `ToastContext.jsx` → `.tsx`. Both old `.jsx` files deleted post-migration.

  **`ToastContext.tsx` — typing fix (primary goal):** replaced
  `createContext(null)` with `createContext<ToastContextValue>(defaultValue)`
  where `defaultValue` has stub functions that throw in dev if called outside
  a provider. This makes `useToast()` return `ToastContextValue` instead of
  narrowing to `never`, which was the root cause of the local `as { showToast:
  ShowToast }` cast in BookmarkCard, AddBookmarkForm, and EditBookmarkModal.
  All three casts removed; those files now call `useToast()` directly without
  any cast. Exported `ToastType`, `Toast` (interface), and `ToastContextValue`
  as named types so future consumers don't need to re-declare them locally.
  The `duration` field is now part of the `Toast` interface (was ignored before)
  so the `ToastItem` component can use it for its own auto-dismiss timer.

  **`Toast.tsx` — visual redesign (§19):**
  - **Surface + left-accent-bar:** `--color-surface` background + a 4px
    `border-l` in the type colour (`border-l-lime` for success, `border-l-coral`
    for error, `border-l-accent` for info) — §19's recommended "Ink background
    + left-accent-bar" treatment. Type colour appears only as the border accent,
    never as text or background fill, which sidesteps the Lime-on-light-surface
    contrast risk §22 flags.
  - **Type glyph:** `✓` / `✕` / `ℹ` renders before the message text (small,
    muted, `aria-hidden`) so type is signalled by both colour AND icon, never
    colour alone (§22).
  - **Entrance animation:** slide from right (`translateX 110%→0`) + fade,
    200ms, design-system easing — §19 "slide-in from the right + fade".
  - **Exit animation:** fade + scale 0.95, 150ms — §19 "fade + slight
    scale-down on dismiss". `ToastItem` component manages its own `dismissing`
    state: triggers the exit animation ~150ms before the context's
    `setTimeout` fires, so the animation plays fully before the DOM node
    disappears. Both directions confirmed in the production CSS bundle.
  - **`aria-live` region (§22 firm requirement):** `role="status"` +
    `aria-live="polite"` on success/info toasts; `aria-live="assertive"` on
    error toasts. The container is always mounted (even with zero toasts) so
    the live region exists in the DOM before announcements fire — mounting
    conditionally on `toasts.length > 0` would miss the first toast.
  - **z-index 60:** sits above the modal scrim (z-50) so toasts remain
    readable while a modal is open.
  - **Click-to-dismiss preserved** from the original implementation.
  - **`prefers-reduced-motion`:** both `animate-toast-in` and
    `animate-toast-out` have `animation: none` overrides in the same
    `@layer utilities` block; elements still appear/disappear, only motion
    is removed, per §21.

  **Verified:** `npx tsc -b --noEmit` (clean, exit 0), `npx vite build`
  (clean, exit 0, 609ms). Confirmed in compiled CSS: `@keyframes toast-in`
  + `toast-out` (correct from/to keyframes), `.animate-toast-in` +
  `.animate-toast-out` with correct `animation:` shorthands, and the
  `prefers-reduced-motion` override — all present in the production bundle.

  - **Task 10 — Bookmark List + Filtering Fixes:** Migrated `BookmarkList.jsx`, `SearchBar.jsx`, and `TagPills.jsx` to `.tsx`.
    - **`SearchBar.tsx`**: Wired up Task 2's `Input` primitive with the leading search icon (`<Search className="size-4" />`), fulfilling §8's exception rule for search fields.
    - **`TagPills.tsx`**: Implemented design tokens for filter pills. `bg-accent-subtle text-accent` for inactive, `bg-ink text-paper` for active. Added `aria-pressed` for screen readers.
    - **`BookmarkList.tsx`**: Added correct generic typing `forwardRef<BookmarkListHandle, {}>` to resolve the `ref` prop issue. Integrated the skeleton loaders and zero-data empty states (for both "Your library is empty" and "No bookmarks match your search"). Added a `Button` component for "Load more".
    - **Filtering Bug / Architecture Note:** The existing implementation uses a client-side filter (`filteredBookmarks`) over the locally loaded paginated data. This limits search/tag filtering to the current page. The fix is deferred to Task 11, which will add a `?search=` param to the backend, turning the client-side filter into a debounced API request. The client-side filter is retained temporarily to preserve UI functionality until Task 11 lands.

  - **Task 11 — Backend Search Endpoint:** 
    - **Backend:** Added `search` query parameter support in `getBookmarks` controller using an `$or` regex match across `title`, `note`, and `url`. Pagination and user scoping are correctly preserved.
    - **Frontend:** Updated `BookmarkList.tsx` to handle the new `?search=` parameter. Removed the client-side search filtering and implemented a debounced `useEffect` for `searchTerm` changes (300ms debounce while typing, instant for initial load or clear).

  - **Task 12 — Search Overlay (Command-K):**
    - Built a global `SearchOverlay.tsx` component that mounts via portal, implementing a ⌘K (Ctrl+K on Windows) pattern for searching the entire library.
    - **Data Flow Fix:** To avoid duplicate search bars and UI clutter, the redundant `SearchBar` component was removed entirely from `BookmarkList.tsx`. The API data flow (the debounced `searchTerm` fetching) was moved up into `SearchOverlay`, making it the single source of truth for global search.
    - **Accessibility:** The overlay uses the established `FOCUSABLE_SELECTORS` trap pattern, trapping Tab/Shift+Tab and supporting Escape to close, returning focus back to the triggering field.
    - **Animations:** Used the design system's default 200–300ms easing curves with full `prefers-reduced-motion` fallbacks in `index.css`.
    - **User Clarification (Deviation):** The user clarified they are on Windows and use Ctrl+K, so the shortcut handling natively binds `Ctrl+K` instead of just Cmd+K.

  - **Task 13 — Empty States:**
    - Replaced the generic placeholder strings across the app with a centralized `<EmptyState />` component.
    - **Typography:** Uses the premium `Fraunces` display serif font (`text-h1` / `font-display`) and generous vertical padding to carry the "editorial" tone.
    - **Variants:** Built the four variants defined in the design system (`library`, `search`, `tag`, `collection`).
    - **Integration:** Replaced the empty states in `BookmarkList.tsx` (Empty Library, Empty Tag) and `SearchOverlay.tsx` (Empty Search). For the library variant, a "Add your first bookmark" button is automatically rendered, which scrolls the user to the form and focuses the URL field.

  - **Task 14 — Error States:**
    - Formalized error handling across the app to prevent blank screens or over-reliance on floating toasts.
    - **Inline Form Validation:** Replaced the toast notification in `AddBookmarkForm.tsx` and `EditBookmarkModal.tsx` for the "URL or Note is required" validation. The inputs now dynamically gain a Coral-colored border and focus ring, and display the error directly beneath the fields.
    - **Full-Section Failure:** Created a new `<ErrorCard />` component (with a Coral-accented border and a "Try again" button) and wired it into `BookmarkList.tsx` to handle initial page load failures (e.g. 500 status or network drop), ensuring the user is never left with a blank screen.
    - **AI Failure Confirmation:** Confirmed that `summary: null` (an AI generation failure) gracefully falls back to a normal bookmark card with no Gist block, breaking no errors and showing no scary UI.

  - **Task 15 — Collections UI:** 
    - Built `CollectionView.tsx` to handle the `/collections/:name` route.
    - Reused `BookmarkList.tsx` by adding a `collection` prop, allowing the collection view to inherit skeleton loading, pagination, global search, and empty states automatically.
    - Added `MobileCollections.tsx` and the `/collections` mobile route, as mobile lacks a permanent sidebar to list collections.
    - Wired the mobile "Collections" tab in `MobileTabBar.tsx` to this new route. Added the mobile search bar directly into the Collections mobile page.

  - **Task 16 — Mobile Responsive Pass:** 
    - **AppShell & Navigation:** Built `MobileTabBar.tsx` for iOS-style bottom navigation on mobile devices (Library, Add, Collections). Removed the temporary `pb-safe` approach in favor of standard fixed bottom positioning after encountering layout bugs in Brave browser.
    - **Add Bookmark Sheet:** Converted the mobile Add Bookmark form into a modal bottom sheet. Implemented a 3D depth effect using `backdrop-blur-sm` and a heavy upward drop-shadow (`shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.5)]`), elevating the sheet without moving the background site.
    - **Framer Motion Gestures:** Implemented swipe-to-dismiss for the bottom sheet using `framer-motion`.
    - **Search:** Added a mobile-only search trigger (read-only search bar) to both `Home.tsx` and `MobileCollections.tsx` that opens the full-screen `SearchOverlay`. Added a mobile "Cancel" button to the `SearchOverlay` for better mobile accessibility.
    - **Deviations:** Initially built a native iOS-style 3D scaling effect where the background site shrunk and dimmed when the Add menu opened. Reverted this entirely due to user pushback ("don't force the background to move"), replacing it with the static backdrop blur.
    - **New Libraries / APIs:** Imported `useDragControls` from `framer-motion` to handle mobile drag gestures.
    - **Bugs Fixed:** 
      - Fixed a missing `key` prop issue inside `AnimatePresence` that caused the mobile Add sheet to disappear completely.
      - Fixed a severe frame-lag/jank issue during the drag gesture on mobile. The fix involved adding `willChange: 'transform'` to force GPU acceleration, restricting the drag listener exclusively to the top pill handle (`dragListener={false}` + `useDragControls`), and applying `touchAction: 'none'` to the handle to prevent the browser from attempting to scroll the form while dragging.

## Immediate Next Task
Task 17 — Animation Pass. Finalizing the micro-interactions, layout transitions, and spring physics across the app to hit the "snappy, tactile" requirements of the design system.

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
- **Font loading:** Self-hosted via `@fontsource/manrope` (400/500/600) + `@fontsource/fraunces`
  (500), imported once in `main.tsx` (Prep Step 4, wired up in Task 1).
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
- **App entry is `main.tsx`, not `main.jsx`** — renamed in Task 1 since it was touched (font
  imports) and the migration constraint requires converting touched files as they're touched.
  `index.html`'s script tag points at `main.tsx` accordingly.
- **Wordmark typeface: Manrope semibold, not Fraunces** — the header wordmark is permanent shell
  chrome, and §3 reserves the display serif for a short list of genuinely editorial moments,
  explicitly excluding functional UI (Task 3).
- **`#root` no longer carries a fixed centered width/border** — that pre-redesign rule moved to a
  new `.legacy-page-frame` class, applied only to `Login.jsx`/`Register.jsx` so their appearance
  is unchanged until Task 19 redesigns them, freeing `#root` to be a plain full-height flex
  container the App Shell can fill edge-to-edge (Task 3).
- **Gist container: background-wash (`bg-lime-wash`), not left-border** — picked for maximum
  visual distinctness per §1's "Gist is the single most visually distinct element" framing;
  open to revisiting in Task 5 (Task 4).
- **Card actions: hover/focus-revealed icon buttons, not a `⋯` overflow menu** — avoids
  building popover/dismiss/keyboard-nav machinery not otherwise in scope; both variants were
  acceptable per §10 (Task 4).

## Established Component APIs
_(Task 2. All five are pure presentational components — no data fetching, no form-submission
logic. All accept a trailing `className` for one-off layout tweaks (margins, grid placement)
without needing new variant props for every future use.)_

### `Button` (`components/Button.tsx`)
```ts
variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'destructive'; // default 'primary'
size?: 'default' | 'compact';                                          // default 'default'
loading?: boolean;   // AI-forward Gist-mark motif — AI-triggering actions only, see §16 note above
// ...plus every native <button> attribute (disabled, type, onClick, aria-*, etc.)
```
Forwards `ref`. Defaults `type="button"` (pass `type="submit"` explicitly on forms). Dev-mode
console warning if it looks icon-only (non-string/number `children`) with no `aria-label`/
`aria-labelledby` (§22).

### `Input` (`components/Input.tsx`)
```ts
label?: ReactNode;
error?: string;                       // sets aria-invalid, coral border, message below
sizeVariant?: 'default' | 'lg';       // 'lg' = the "Paste a URL" field treatment, §8
leadingIcon?: ReactNode;              // search field's leading icon; §8's one carved-out exception
wrapperClassName?: string;            // className for the outer label+field+error wrapper
// ...plus every native <input> attribute
```
Forwards `ref` to the `<input>`. Auto-generates an `id` via `useId()` if none passed, so
`label`/`htmlFor` pairing works even when the caller doesn't manage ids.

### `Textarea` (`components/Textarea.tsx`)
```ts
label?: ReactNode;
error?: string;
wrapperClassName?: string;
// ...plus every native <textarea> attribute; `rows` defaults to 3 per §8's minimum
```
Same id/ref/error behavior as `Input`. Resize is locked to vertical only (`resize-y`).

### `Tag` (`components/Tag.tsx`)
```ts
active?: boolean;     // filter-pill selected state (§12) — leave unset for static display tags
noPrefix?: boolean;   // suppress the auto-added "#" — for the "+2" overflow indicator, not a tag name
children: ReactNode;
onClick?: (e) => void; // presence of onClick is what switches the render from <span> to <button>
```
Renders `<span>` when no `onClick` is passed (static display, e.g. a bookmark card's tag row),
`<button type="button">` with `aria-pressed` when `onClick` is passed (toolbar filter pills) —
same visual component either way.

### `Badge` (`components/Badge.tsx`)
```ts
variant?: 'neutral' | 'success' | 'error'; // default 'neutral' — §12's collection badge
children: ReactNode;
```
`neutral` = collection badge (muted text, faint bg, no border — deliberately distinct from
`Tag`'s bordered pill shape). `success`/`error` follow §2's semantic mapping (lime+ink / coral)
for "processed" badges and similar status labels — not yet consumed by any component, added for
Task 5 (Gist "processed" state) and Task 14 (error states) to reuse rather than reinvent.

## Open Questions
- `frontend/eslint.config.js` still only lints `.js`/`.jsx` (`files: ['**/*.{js,jsx}']`) — every
  `.ts`/`.tsx` file added since Part A/Task 1, including all of Task 2's new primitives, is
  currently unlinted. Not fixed as part of Task 2 since it's a pre-existing, project-wide gap
  rather than something this task introduced — but flagging it as worth a small dedicated fix
  (extend the glob, add `typescript-eslint`) before it accumulates further.
- `--color-surface-elevated` has no defined light-mode value in the design system (dark-mode-only
  row in §2) — currently defaulted to equal `--color-surface`; revisit if a later task needs it
  distinct (Task 0).
- Dark-mode accent/lime/coral contrast-as-text-color check (spec's "desaturate ~10–15% if a
  contrast check fails against `#19191E`") not yet run — deferred to Task 18, but flag earlier if
  any task puts accent/lime/coral text directly on a dark surface before then (Task 0).
- Heading/body responsive behavior at the 1024px breakpoint was simplified to "no shrink" rather
  than carrying forward the old scale's tablet step — worth a visual check once the app actually
  renders at that width, not just a spec read (Task 1).
- **Collections future:** The user flagged they may want to remove collections from the backend entirely after the redesign is complete, since tags may be sufficient. Noted here to revisit after Task 20 (Final QA Pass). Do not remove until that decision is made (Task 7).
- **Mobile Browsers (Brave):** Brave browser's ad-blocker/shields occasionally interfere with fixed-position UI elements. We removed `pb-safe` but need to keep an eye on bottom nav rendering on aggressively-blocked mobile browsers (Task 16).
- **Mobile Drag Handle UX:** The drag-to-close behavior on the mobile Add Bookmark sheet works smoothly, but it is currently bound *only* to the top drag handle. We restricted it to avoid scroll conflicts with the form itself, but it remains an open UX question whether users will naturally expect to be able to drag anywhere on the sheet (Task 16).