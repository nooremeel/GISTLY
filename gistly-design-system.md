# Gistly Design System — "Editorial Intelligence"

Adapted from the provided design-system brief to the actual Gistly application: its current routes (`/login`, `/register`, `/`), data model (`title`, `url`, `note`, `tags`, `collection`, `summary`), and the component inventory from the prior UX audit. This is a specification to design and build against — no code yet.

Where the source brief describes a marketing/dashboard-style app broader than what Gistly currently is (multi-section sidebar, favorites, archive), this document adapts those ideas down to what the real product needs today, while leaving room to grow into them, since `collection` already exists as a backend concept with no UI yet.

---

## 1. Overall Visual Concept

Gistly is a personal library, not a tool. The interface should feel like opening a well-kept notebook that happens to have a quiet, sharp assistant living inside it — not like opening a SaaS dashboard.

**The one-sentence test:** every screen should read as "a place where I keep and understand the things I've saved," never as "a form connected to a database."

Concretely, this means:
- The bookmark list is the product. It gets the most design attention of anything in the app — more than the shell, more than the forms.
- The Gist (AI insight) is the product's signature — it should be the single most visually distinct element on a card, always legible at a glance, never disguised as ordinary metadata.
- Chrome (nav, header, forms) stays quiet on purpose. Warm paper background, ink text, thin borders, restrained motion — the content should never have to compete with its container.
- Violet is the only saturated color allowed to dominate a screen, and only in small doses (an active state, a focus ring, the Gist mark). Lime is a signature, not a background. Coral is rare and reserved for real attention states.
- Nothing floats, glows, or glasses. Elevation comes from a thin border and a very soft shadow, not blur.

This directly replaces the current implementation's biggest gap identified in the audit: unstyled native buttons, a competing black/white tag treatment, and an AI Gist rendered as a plain `<p>` indistinguishable from user-typed notes. Editorial Intelligence fixes exactly that: distinct typographic and color treatment per content type, calm chrome around it.

---

## 2. Color System

### Light mode (default)

| Token | Value | Usage |
|---|---|---|
| `--color-ink` | `#17161A` | Headings, primary text, primary button surfaces |
| `--color-paper` | `#F6F3ED` | App background (`body`, page canvas) |
| `--color-surface` | `#FFFDF9` | Cards, modals, dropdowns, the header bar |
| `--color-muted` | `#6F6B73` | Secondary text — URLs, notes, helper text |
| `--color-faint` | `#AAA6AD` | Placeholders, timestamps, disabled text |
| `--color-line` | `#DDD9D2` | Borders, dividers, input outlines |
| `--color-accent` (Gist Violet) | `#7357FF` | Primary buttons, links, active nav, focus rings, the Gist mark |
| `--color-accent-subtle` | `#7357FF` at 8–10% opacity | Selected states, hover backgrounds, active nav background |
| `--color-lime` (Acid Lime) | `#DFFF57` | Gist highlight accents, "processed" badges, favorite/save confirmation — never as body-text-on-lime for long text (contrast) |
| `--color-coral` | `#FF806F` | Destructive-action emphasis, validation errors, rate-limit/attention toasts |

### Dark mode

Not an inversion — a distinct "evening reading" palette.

| Token | Value | Usage |
|---|---|---|
| `--color-ink` (dark) | `#F4F1EA` | Primary text |
| `--color-paper` (dark) | `#111114` | App background |
| `--color-surface` (dark) | `#19191E` | Cards, modals |
| `--color-surface-elevated` (dark) | `#222229` | Dropdowns, popovers, command palette |
| `--color-muted` (dark) | `#A5A1AA` | Secondary text |
| `--color-line` (dark) | `#323139` | Borders |
| Accent colors | same hex, desaturated ~10–15% if a contrast check fails against `#19191E` | Violet and lime must both pass a contrast check against dark surfaces before use as text color; as *backgrounds behind ink text* they're generally safe as-is. |

### Semantic mapping (replaces today's ad hoc hardcoded hex)

- **Success** → Lime background + Ink text (not a generic green) — this is the one deliberate deviation from typical SaaS conventions, and it's intentional: "processed successfully" should feel like a Gistly moment, not a system checkmark.
- **Error / destructive** → Coral.
- **Info / neutral** → Muted text on Surface, no accent color needed.
- **Interactive / focus** → Violet, always as a 2px ring, never as the only signal (see §22 Accessibility).

### Rule

Violet appears on at most one or two elements per screen at rest (e.g., one active nav item, one primary button). If a screen has three violet elements demanding attention simultaneously, something is over-designed.

---

## 3. Typography

### Typefaces

- **Interface (primary):** Manrope — contemporary, warm, slightly more editorial character than Inter while remaining highly legible at small sizes. (Inter as fallback if Manrope has variable-font/loading issues.)
- **Editorial display (restrained use only):** Fraunces — used exclusively for: the empty-library first-run headline, the login/register page's supporting line, and any future marketing surface. Never in the bookmark list, never in form labels, never in the Gist.
- **Mono:** keep the existing `ui-monospace` stack for URLs/domains — a monospace or near-monospace treatment for domain text (`domain.com`) reads as "precise" and separates it visually from the editorial title above it, per the card structure in §10.

### Scale

| Role | Size | Weight | Typeface | Where used |
|---|---|---|---|---|
| Display | 56–72px | 500, Fraunces | Serif | Login/Register supporting line, empty-library headline only |
| H1 | 36–44px | 600, Manrope | Sans | Page-level heading (e.g. "Your library") |
| H2 | 26–30px | 600 | Sans | Section headings ("Recently saved," "Most used tags") |
| H3 | 19–21px | 600 | Sans | Card titles, modal titles |
| Body Large | 17–18px | 400 | Sans | Note/summary body text where emphasis matters |
| Body | 15–16px | 400 | Sans | Default UI text, form inputs, buttons |
| Small | 13–14px | 500 | Sans | Tags, timestamps, metadata, domain label |
| Micro | 11–12px | 500, uppercase, tracked | Sans | "GIST" label, badges only |

### Rules
- Card titles (H3) are the heaviest weight seen in the bookmark list — nothing else in a card should compete with it.
- The domain/URL line uses Small size, Muted color, and either the mono stack or a tightened letter-spacing to visually separate it from the note/gist body text below.
- Never use the display serif for functional UI — it exists only for the two or three genuinely "editorial" moments the app has (first-run empty state, auth screens).

---

## 4. Spacing System

An 4px base scale, used consistently instead of the current app's ad hoc `0.25rem`/`8px`/`10px` mix:

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96`

| Token | Value | Typical use |
|---|---|---|
| `space-1` | 4px | Icon-to-text gap, tag internal padding |
| `space-2` | 8px | Tight stacks (label to input) |
| `space-3` | 12px | Form field vertical rhythm |
| `space-4` | 16px | Card internal padding (small), button padding |
| `space-6` | 24px | Card internal padding (default), section gaps within a card |
| `space-8` | 32px | Gaps between cards in a list, form-to-form-field top margin |
| `space-12` | 48px | Section-to-section gaps on a page |
| `space-16` | 64px | Page top padding, hero/empty-state vertical rhythm |
| `space-24` | 96px | Large editorial breathing room (empty states, auth pages) |

**Rule:** whitespace is a design decision, not a leftover. Two cards should never be separated by an arbitrary value not on this scale.

---

## 5. Border-Radius System

Mixed, not uniform — matches the "not everything is a rounded floating card" principle.

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 6px | Tags/pills, small badges, checkboxes |
| `radius-md` | 10px | Buttons, inputs, the Gist highlight block |
| `radius-lg` | 16px | Bookmark cards, modal panels |
| `radius-feature` | 24px | Rare — the command/search overlay only |

Text-heavy editorial elements (the empty-state block, the Gist mark container) should lean toward the sharper end (`sm`/`md`) rather than `lg`/`feature`, per the brief's instruction to avoid uniform heavy rounding.

---

## 6. Shadows

Borders and tonal surface contrast do the primary elevation work. Shadows are reserved for genuinely floating elements.

```css
--shadow-sm: 0 1px 2px rgba(23, 22, 26, 0.04);          /* resting cards, optional */
--shadow-md: 0 8px 30px rgba(23, 22, 26, 0.06);          /* dropdowns, popovers */
--shadow-lg: 0 16px 48px rgba(23, 22, 26, 0.10);         /* modals, command palette */
```

- **Bookmark cards at rest:** border only (`--color-line`), no shadow, `--color-surface` against `--color-paper` background provides enough contrast.
- **Bookmark cards on hover:** `--shadow-sm` + border shifts to a slightly darker/violet-tinted line — a small, honest lift, not a dramatic float.
- **Modals, the search/command overlay, dropdown menus:** `--shadow-lg`/`--shadow-md` respectively — these are the only elements allowed a real shadow, because they're genuinely detached from the page flow.
- **Toasts:** `--shadow-md` — they're floating notifications, a shadow here is earned.

---

## 7. Buttons

Directly addresses the audit's top finding: there is currently no button component at all (native unstyled `<button>` everywhere).

### Variants

| Variant | Background | Text | Border | Use |
|---|---|---|---|---|
| Primary | `--color-ink` | `--color-paper` | none | "Save bookmark," "Login," "Register" — one per screen/section |
| Accent | `--color-accent` | white | none | Rare — reserved for a genuinely AI-forward moment (e.g. "Ask Gistly to group these") if that feature ships; not used for routine actions, to keep violet meaningful |
| Secondary | `--color-surface` | `--color-ink` | `--color-line` 1px | "Add note," "Cancel," "Load more" |
| Ghost | transparent | `--color-muted` | none | "Edit," inline low-emphasis actions |
| Destructive | transparent → `--color-coral` on hover | `--color-coral` | `--color-coral` at 30% | "Delete" |

### States
- **Hover:** subtle darken/lighten (~6–8%) + `--shadow-sm` on Primary/Accent only.
- **Active/press:** scale to 0.98 over 100ms, no shadow change.
- **Focus-visible:** 2px `--color-accent` ring, 2px offset — always, on every variant, no exceptions (see §22).
- **Disabled:** 50% opacity, no hover/press transform, cursor `not-allowed`.
- **Loading (e.g. "Add Bookmark" during AI processing):** replace label with a short animated Gist-mark motif (see §16), not a generic spinner — reinforces the brand mark even in a loading state.

### Sizing
- Default height 40px, `radius-md`, `space-4`–`space-6` horizontal padding, Body-size text at medium weight.
- Compact height 32px for inline card actions (Edit/Delete), `radius-sm`.

---

## 8. Inputs

### Structure (preserves the existing, already-accessible label-above-input pattern)

- Label: Small size, 600 weight, `--color-ink`, `space-2` below it.
- Field: `--color-surface` background, 1px `--color-line` border, `radius-md`, `space-3`–`space-4` internal padding, Body text.
- Placeholder: `--color-faint`.
- Focus: border shifts to `--color-accent`, plus a 2px accent ring at low opacity outside the border — never rely on border-color change alone (contrast/colorblind concern).
- Error: border shifts to `--color-coral`, a short inline message below in Small/coral text — replaces generic browser validation styling.
- Textarea (note field): same treatment, resizable vertically only, minimum 3 rows.

### Explicitly not doing
No floating labels (brief explicitly rules this out and it would be a regression from the current, working label pattern). No inline icon-in-input clutter except the search field's leading search icon (see §14).

### The "Paste a URL" field specifically
Per §12, the URL input in the bookmark-creation flow gets slightly larger sizing (Body Large, taller field) than other inputs on the same form — it's the primary action of that whole component, and should read as such before the user's eye even reaches "Tag it" / "Add a note."

---

## 9. Cards

General card primitive (used for anything that is *not* a bookmark — e.g. a settings panel, a tag-group panel):

- `--color-surface` background, 1px `--color-line` border, `radius-lg`, `space-6` padding, `--shadow-sm` optional (prefer border-only at rest).
- No card should sit directly on another card with only a shadow separating them — always a visible gap (`space-6`+) or a border.

Bookmark cards are a specialized variant — see §10, since the brief correctly calls this out as the single most important component in the app.

---

## 10. Bookmark Cards

The product's core surface. Structure, adapted to the real data model (`title`, `url`, `note`, `tags`, `collection`, `summary`):

```
┌───────────────────────────────────────────────┐
│  domain.com                              ⋯     │   ← Small, Muted/mono, kebab menu top-right
│                                                 │
│  A visually interesting title that wraps       │   ← H3, Ink, heaviest element on the card
│  naturally across two lines if needed           │
│                                                 │
│  ✦ GIST                                        │   ← Micro, uppercase, tracked, Violet
│  A concise, slightly opinionated insight        │   ← Body, Ink, on a subtle Lime/Violet-tinted
│  about why this might be worth revisiting.      │     background block, radius-md, space-4 padding
│                                                 │
│  User's own note, if present, renders separately│   ← Body, Muted — visually subordinate to the Gist
│  and below it, never merged into the same block │
│                                                 │
│  #design  #frontend        Uncategorized  3m ago│   ← Small tags (left) + collection badge + timestamp (right)
└───────────────────────────────────────────────┘
```

### Key decisions (fixing specific audit findings)

- **Left-aligned, not centered** — the current implementation centers all card text; editorial content reads left-aligned.
- **The Gist gets its own visually bounded block** (subtle tinted background, `radius-md`, distinct from the plain-text note beneath it) — this single change fixes the audit's most important finding: "a user cannot tell what Gistly generated vs. what they typed."
- **Collection renders as a small labeled badge**, not a bare unstyled line of text — fixes the "stray duplicate tag" reading identified in the screenshot review.
- **Tags get real spacing and pill treatment** (see §12) — fixes the current run-on, unspaced tag text bug.
- **Domain, not full URL, is the visible metadata line** — `https://en.wikipedia.org/wiki/League_of_Legends` becomes `en.wikipedia.org`, with the full URL available via the Edit action or an "Open" affordance — reduces visual noise dramatically versus the current raw-URL-as-a-line-of-text treatment.
- **Actions (Edit/Delete) move into a `⋯` overflow menu or become hover-revealed**, rather than two permanently-visible buttons at the bottom of every card — keeps the resting state calm per the brief's hover-reveals-actions guidance.

### Variants

- **Default:** as above, border-only, `--shadow-sm` off.
- **Hover:** `--shadow-sm` on, border shifts slightly toward `--color-accent` at low opacity, overflow menu/actions fade in (150ms), 2px translate-up.
- **Selected** (future multi-select, if added): `--color-accent-subtle` background wash + accent border, no shadow needed.
- **Processing:** see §16.
- **AI Generated (Gist present):** the tinted Gist block as described above is the permanent "AI generated" visual state — no separate treatment needed once the summary exists.
- **Favorite** (if/when this ships — not in current data model): small heart/star, filled Lime on activation, brief scale-burst on toggle (~150ms).

---

## 11. AI Gist Component

Standalone spec, since it's the product's signature element.

- **Label:** `✦ GIST` — Micro size, uppercase, letter-spacing ~0.06em, Violet color, sits directly above the gist text, `space-1` gap.
- **Container:** subtle background wash — either `--color-lime` at ~12–15% opacity or `--color-accent-subtle`, `radius-md`, `space-4` padding, optionally a 2px accent-colored left border instead of a full background wash as an alternate, quieter treatment (test both; the left-border version reads slightly more "editorial annotation," the wash version reads slightly more "highlighted".)
- **Text:** Body size, Ink color (never Muted — the Gist is a first-class statement, not secondary metadata), allowed to feel *slightly opinionated* in tone per the copy guidance in the brief ("Useful reference for..." rather than a flat restatement).
- **Absent case:** when `summary` is `null` (AI failure, per the app's existing fail-soft contract), do not render an empty Gist block — omit it entirely rather than showing "No summary generated," which currently reads as an error when it isn't one operationally. A card without a Gist should look like a slightly quieter, still-complete card, not a broken one.
- **Entrance animation:** when a bookmark is freshly created and the Gist streams in after the loading state, it fades + expands from 0 to full height over ~300ms with the brief's suggested easing — this is the "small transformation" moment called out in §12/§27 of the source brief, and it's the single highest-value motion moment in the app.

---

## 12. Tags

- **Format:** `#tagname`, Small size, `radius-sm`, `space-1`–`space-2` padding, thin `--color-line` border, `--color-surface` background at rest.
- **Active/selected (filter pills in the list toolbar):** `--color-accent-subtle` background + `--color-accent` text/border — replaces the current black-fill/white-fill treatment, which visually competes with the violet accent used everywhere else.
- **Deterministic subtle color-from-tag-name** (optional, phase 2): a low-saturation hash-based tint per tag for quick visual scanning across a large library — explicitly not rainbow/saturated, just enough variation to aid recognition (e.g. 4–6 pre-approved subtle tints rotated by hash, not infinite hues).
- **Overflow:** if a card has more than ~4 tags, show the first 3–4 and a `+2` overflow indicator rather than wrapping indefinitely — avoids the "huge pill collection" anti-pattern called out in the brief.
- **Collection badge** (distinct from tags): slightly different shape — a small rounded-rectangle label, `--color-muted` text on a faint neutral background, positioned separately from the tag row (see card layout in §10) so it never gets confused with a tag, addressing the current run-together rendering bug.

---

## 13. Navigation

Given the current app is a single route (`/`) with no sidebar, and `collection` is a real backend feature with zero UI, this is the biggest structural addition this design system proposes — introduced carefully, not as a wholesale dashboard rebuild.

### Recommended shell (desktop)

```
┌──────────────────────────────────────────────────────┐
│ Gistly     [ ⌕ Search... ⌘K ]      [+ Add]   [avatar]│
├───────────┬────────────────────────────────────────────┤
│ Library   │                                            │
│ Tags      │            Main content                    │
│ Collections│                                           │
│           │                                            │
└───────────┴────────────────────────────────────────────┘
```

- **Sidebar is quiet:** `--color-paper` background (same as page, not a contrasting panel), Small/Body text, no icons required but if used, thin/geometric (Lucide, per §21 of the brief), `--color-muted` at rest.
- **Active item:** `--color-accent-subtle` background wash behind the label, Ink or Violet text — never a solid saturated violet block (explicitly called out as an anti-pattern in the source brief).
- **Sections, mapped to what the app actually has:** "Library" (all bookmarks — the current default view), "Tags" (browseable list, using the existing `getByTag` endpoint), "Collections" (finally surfaces the existing `getGrouped` endpoint with real UI). "Favorites"/"Archive" from the source brief are **not included** — they don't exist in the current data model and shouldn't be designed for until there's a product decision to add them.
- **Header bar:** logo/wordmark left, search trigger center-left (or center, see §14), primary "Add" action, account/logout menu right (replacing the current bare "Logged in as ... Logout" text strip).

### Mobile
See §20 — sidebar collapses to a bottom tab bar, not a hamburger drawer, per the brief's mobile guidance.

---

## 14. Search

Elevated from the current always-visible, client-side-only text input to a proper signature interaction — while flagging that the underlying data-flow bug identified in the audit (search only matches already-loaded pages) needs a backend fix (server-side search endpoint) before this can be fully honest at scale; the design below assumes that fix ships alongside it.

- **Trigger:** a persistent, low-emphasis search field in the header (`⌕ Search bookmarks... ⌘K`), `--color-surface` background, `--color-line` border, `radius-md`.
- **Activated (⌘K or click):** expands into a centered command-style overlay — `--color-surface` panel, `--shadow-lg`, `radius-feature` (the one place large radius is appropriate per §5), backdrop dims the page slightly (opacity scrim on `--color-ink`, not a blur).
- **Overlay contents:** live-filtered results grouped simply (e.g. by recency or relevance), each result rendered as a compact single-line title + domain, not a full card — keeps the overlay fast to scan.
- **Empty query state inside overlay:** could surface "Most used tags" or "Recently saved" as a helpful default instead of a blank panel.
- **No-results state:** see §15.
- **Animation:** overlay expands from the trigger's position (not a generic centered fade-in) over ~250ms with the brief's easing curve — reinforces that search "lives" in that header field rather than appearing from nowhere.

---

## 15. Empty States

Replaces the current generic "No bookmarks yet." with contextual, personality-driven copy, styled distinctly (using the restrained editorial serif from §3 for the headline only):

| Context | Headline (serif, Display/H1 scale) | Subtext (Body, Muted) | Action |
|---|---|---|---|
| Empty library (first run) | "Nothing saved yet." | "Start collecting the things future-you will thank you for." | Primary button: "Add your first bookmark" |
| Empty search results | "No useful matches yet." | "Try a different phrase or search by tag." | none, or a "Browse all tags" link |
| Empty tag | "Nothing lives here yet." | "Save something with this tag and it'll appear here." | none |
| Empty collection | "This collection is empty." | "Bookmarks you assign here will show up." | none |

Visual treatment: centered within the content column (not full-bleed), generous vertical padding (`space-16`–`space-24`), no illustration required — typography carries the moment, consistent with "editorial" over "illustrated SaaS."

---

## 16. Loading States

Two distinct situations, both currently handled with plain text ("Loading...", static button labels) in the existing app:

### List/page loading (bookmarks fetching)
Skeleton cards — same outer shape as a real bookmark card (border, `radius-lg`, matching padding), with muted-tone placeholder bars for title/gist/tags at reduced opacity, a very subtle shimmer sweep (not the generic spinner the brief warns against). 3–4 skeleton cards on initial load.

### AI processing (bookmark being created/analyzed)
This is the app's signature loading moment and deserves specific, branded treatment rather than a generic spinner:
- The new card appears immediately in the list (optimistic placement) in a "processing" variant: normal title/domain rendered as soon as known, and where the Gist will appear, a small animated Gist-mark (✦) pulses gently or a thin shimmer bar sits in the Gist block's place, with a Micro-size label like "Reading the page and forming a gist…" instead of a bare spinner.
- Duration: matches actual AI latency (multi-second, per the existing backend's 6s fetch timeout) — the animation should read as calm "thinking," not urgent loading, given the timescale.
- Resolution: the shimmer/placeholder resolves into the real Gist via the entrance animation described in §11 — this is the "small transformation" the brief calls for.

### Button loading (form submit)
Replace static text swap with the same small Gist-mark motif animating in place of the button label (see §7) for AI-triggering actions specifically (Add Bookmark); plain disabled state + text swap is fine for non-AI actions (Login, Save edit, Delete).

---

## 17. Error States

Currently handled entirely via toasts (adequate for transient errors) plus inline red text on auth forms. This system keeps that split but formalizes it:

- **Field-level validation errors** (e.g. "Provide a URL or a note"): inline, Small text, Coral color, directly beneath the relevant field — not a toast, since the user's attention is already there.
- **Request-level errors** (409 duplicate email, 429 rate limit, 404 stale resource): toast, using the existing message-per-status-code convention from the current `apiClient` (preserve exactly, per the audit's §15 "must not break" list) — styled per §19.
- **Full-section failure** (e.g. bookmark list fails to load at all — network down, 500): a dedicated inline error card in place of the list, Coral-accented border, short message + a "Try again" secondary button — currently this case has no distinct UI (only a toast fires) and would leave the page looking empty/broken; this closes that gap.
- **AI failure specifically is not an error state** — per the existing, correct backend contract (`summary: null` never throws), this renders as the "Gist absent" case in §11, not as any kind of error UI. Important distinction to hold onto: a failed AI call should never alarm the user.

---

## 18. Modals

Addresses the audit's accessibility findings for `EditBookmarkModal` (no focus trap, no Escape handling, no ARIA) as design requirements, not just implementation notes:

- **Panel:** `--color-surface`, `radius-lg`, `--shadow-lg`, max-width ~480–560px, vertically centered, internal `space-6`–`space-8` padding.
- **Scrim:** `--color-ink` at ~40–50% opacity behind the panel, no blur.
- **Entrance:** panel scales from 0.96→1 + fades in, ~200ms, brief's easing curve; scrim fades in slightly faster.
- **Required interaction behavior** (design spec, not just code): focus moves to the first field on open; `Escape` closes; clicking the scrim closes; focus is trapped within the panel while open; focus returns to the triggering element on close; the panel is announced as a dialog to assistive tech with an accessible title tied to the modal heading.
- **Footer actions:** right-aligned, Secondary ("Cancel") + Primary ("Save") — consistent left-to-right order across all modals in the app.
- **Content:** reuses the same input/label treatment as the main creation form (§8) — the current app already duplicates this markup between `AddBookmarkForm` and `EditBookmarkModal`; the design system treats these as one shared form-field pattern to be implemented once.

---

## 19. Toasts

- **Container:** top-right (preserve current position — it's a reasonable, well-understood convention), `space-4` from viewport edges, stacked with `space-2` gaps, `--shadow-md`.
- **Shape:** `radius-md`, `space-3`–`space-4` padding, max-width ~360px so long messages wrap rather than stretching the container.
- **Type styling** (replacing today's hardcoded green/red hex):
  - Success → Lime background (~90% opacity) + Ink text, or Ink background + small Lime accent dot — pick one and apply consistently; recommend Ink background + Lime left-accent-bar for legibility, since pale lime behind white text is a contrast risk.
  - Error → Coral background + white/Ink text (verify contrast) or Surface background + Coral left-accent-bar + Coral text — consistent with the "accent bar over full-saturation fill" pattern for restraint.
  - Info → Surface background, `--color-line` border, Ink text, no accent bar needed.
- **Entrance/exit:** slide-in from the right + fade (~200ms), fade + slight scale-down on dismiss (~150ms) — currently these appear/disappear with no transition at all.
- **Accessibility:** the toast region must be an `aria-live="polite"` (or `assertive` for errors) region — currently entirely silent to screen readers per the audit; this is a firm requirement, not optional polish.
- **Auto-dismiss:** preserve the existing 3.5s default; extend automatically for longer messages (e.g. rate-limit copy) rather than a fixed duration regardless of content length.

---

## 20. Mobile Behavior

Mobile is a first-class reading/collecting surface, not a shrunken desktop layout — addresses the audit's finding that no product component currently has any responsive rules at all.

- **Header:** collapses to logo + search icon + add icon; account menu behind a single avatar tap target.
- **Navigation:** bottom tab bar — `Library · Search · Add · Tags` (mirrors the brief's suggestion, adapted to drop "Home" since there's no separate dashboard page) — fixed, `--color-surface` background, `--color-line` top border, active tab in Violet.
- **Bookmark cards:** stack full-width, slightly reduced padding (`space-4` instead of `space-6`), Gist block remains fully visible by default (never collapsed behind a "show more" tap, per the brief's explicit instruction) — this is a hard requirement given the Gist is the product's core value.
- **Tags row:** horizontally scrollable single line rather than wrapping to multiple lines, to preserve vertical rhythm on small screens.
- **Add Bookmark:** becomes a dedicated full-screen or bottom-sheet flow triggered from the tab bar's Add icon, rather than an always-visible inline form competing for scroll space above the list (a real UX improvement over the current desktop-first "form always on top of the list" layout).
- **Search overlay:** becomes full-screen on mobile rather than a centered floating panel.
- **Modals** (Edit): become bottom sheets on mobile (slide up from bottom, rounded top corners only, `radius-lg`) rather than centered dialogs — more natural touch ergonomics, standard mobile pattern.

---

## 21. Animation Principles

Timing and easing, applied consistently:

- **Micro-interactions** (button press, tag toggle, focus ring appearance): 120–180ms.
- **Component transitions** (card hover lift, modal open, toast in/out, tag pill selection): 200–300ms.
- **Larger/page-level transitions** (Gist entrance, search overlay expand, route change if animated): 300–500ms.
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` throughout — a soft decelerate, avoids the bounce/spring effects the brief explicitly rules out.

### Where motion is used
Card entrance (new bookmark slides/fades in), Gist fade+expand entrance, tag creation micro-animation, favorite burst (if shipped), search overlay expand-from-trigger, button press scale, toast slide-in/out, sidebar active-state background transition.

### Where motion is explicitly avoided
No floating/idle animations on static elements. No parallax. No decorative motion unconnected to a state change. No bounce/spring easing anywhere. Loading states favor a calm shimmer/pulse over a spinning indicator, per §16.

### `prefers-reduced-motion`
Every animation listed above must have a reduced-motion fallback: instant state change (opacity/position snap, no transition) rather than removing the state change altogether. This applies globally, not per-component — a single top-level media query rule set, not case-by-case implementation.

---

## 22. Accessibility Principles

Formalizes the audit's findings into standing requirements for this design system, not just bug fixes:

- **Contrast:** all text/background pairs in both light and dark palettes must be checked against WCAG AA (4.5:1 body text, 3:1 large text/UI components) before final values ship — flag specifically: Muted-on-Paper, Faint-on-Surface, and any text set directly on Lime need explicit verification, since Lime is a light, low-contrast color by nature and is only ever safe as a background behind Ink text or as a thin accent, never as text color itself.
- **Focus states:** every interactive element (buttons, inputs, tags, cards if selectable, tab bar items) gets a visible 2px Violet focus ring on keyboard focus — no exceptions, and never removed via `outline: none` without a replacement.
- **Color is never the only signal:** active tag/nav state pairs a background/border change with a text-weight or icon change too; error states pair color with an icon and text, not color alone; the "processing" card state pairs its shimmer with an explicit text label.
- **Motion:** full `prefers-reduced-motion` support as specified in §21.
- **Semantic structure:** proper landmark regions (`header`, `nav`, `main`), heading hierarchy that matches the type scale in §3, and — specifically fixing the current gap — a live region for toasts and an announced loading state during the async auth check on app load.
- **Modals:** full focus-trap/Escape/ARIA-dialog behavior as specified in §18, non-negotiable given it's currently entirely absent.
- **Forms:** preserve and extend the existing (correct) `<label htmlFor>`/`id` pairing convention to every new form-like surface introduced by this system (search overlay input, any future settings form).
- **Icon-only buttons** (overflow `⋯` menu, favorite icon, mobile tab bar icons): always paired with an `aria-label`, never icon-only with no accessible name.

---

## Summary

This system keeps everything from the current app that already works well structurally (label/input pairing, the toast architecture, the fail-soft AI contract) and gives it, for the first time, an actual visual language: warm paper and ink instead of dark-generic-SaaS gray, one disciplined violet accent instead of a competing black-and-purple mix, a real component set (buttons, tags, cards) instead of unstyled native elements, and — most importantly — a Gist component that finally looks like the reason someone would use this product, instead of a plain paragraph indistinguishable from a user's own note.

Next step, when ready: a component inventory / build order (primitives → composed components → pages) for the TypeScript + Tailwind implementation.
