/**
 * Core Bookmark entity reflecting backend persistence and API contract.
 * Optional fields mirror schema invariants (e.g. either URL or note required,
 * nullable AI summary on generation failure).
 */
export interface Bookmark {
  _id: string;
  user: string;
  title: string;
  url?: string;
  note?: string;
  tags: string[];
  summary?: string | null;
  imageUrl?: string;
  collection: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionGroup {
  _id: string;
  count: number;
  bookmarks: Bookmark[];
}

export interface TagGroup {
  _id: string;
  count: number;
}
