/**
 * Shared `Bookmark` shape (Task 4). Mirrors `backend/models/Bookmark.js`
 * and the JSON the API actually returns — defined once here and reused by
 * every later task that touches bookmark data (list, forms, modal,
 * collections) rather than redeclared per-component, per Task 4's
 * `DESIGN_PLAN.md` "Done When" criterion.
 *
 * Notes on fidelity to the backend contract:
 * - `timestamps: true` on the Mongoose schema adds `createdAt`/`updatedAt`
 *   — serialized as ISO date strings over JSON, not `Date` instances.
 * - The schema validates that at least one of `url`/`note` is present, but
 *   neither is individually `required`, so both stay optional here.
 * - `summary` is `null`/absent, never an error, per the AI fail-soft
 *   contract (`STATE.md`) — typed as optional/nullable so callers are
 *   forced to handle the absent case rather than assuming it's always a
 *   string.
 * - `collection` defaults to `'Uncategorized'` server-side (not optional
 *   in practice), but is typed as a plain `string` rather than a literal
 *   union since it's free text, not a fixed enum.
 */
export interface Bookmark {
  _id: string;
  user: string;
  title: string;
  url?: string;
  note?: string;
  tags: string[];
  summary?: string | null;
  collection: string;
  createdAt: string;
  updatedAt: string;
}
