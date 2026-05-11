import type { LessonLang } from "@/lib/db/schema";

// Shape persisted to disk in public/search-index/lessons-{lang}.json.
// Keep this type stable; the build script and the client loader both
// depend on it. Adding a new field is backwards-compatible if the field
// is optional.
export type LessonIndexEntry = {
  // Unique ID across both languages. Format:
  //   "{lang}:{track}/{slug}"              for the top-level lesson entry
  //   "{lang}:{track}/{slug}#{headingId}"  for a heading entry
  id: string;
  kind: "lesson" | "heading";
  lang: LessonLang;
  // Track and slug match the existing lesson route convention.
  track: string;
  trackLabel: string;
  slug: string;
  // Sortable position from the lesson registry.
  order: number;
  // Assignment ID used by /[locale]/lesson/[id] routes.
  assignmentId: string;
  // Lesson title: searchable, also rendered in the result row.
  title: string;
  // For heading entries: the heading text and its slug ID.
  heading?: string;
  headingId?: string;
  // Searchable prose body. For lesson entries: the full stripped prose
  // (minus the title heading). For heading entries: prose that falls
  // under the heading until the next heading at the same or higher
  // level. Empty bodies are allowed (a heading with no prose under it).
  body: string;
  // Pre-computed deep-link href. The locale will be prepended by the
  // client side at render time.
  href: string;
};

// What the client gets back from /api/admin-search.
export type AdminSearchResponse = {
  users: AdminUserResult[];
  drafts: AdminDraftResult[];
  audit: AdminAuditResult[];
};

export type AdminUserResult = {
  email: string;
  role: "admin" | "editor" | "viewer";
  note: string | null;
  href: string;
};

export type AdminDraftResult = {
  id: number;
  track: string;
  slug: string;
  lang: LessonLang;
  // Trimmed excerpt of the draft content for the result row.
  snippet: string;
  updatedAt: string; // ISO timestamp; serialized for transport
  authorEmail: string;
  href: string;
};

export type AdminAuditResult = {
  id: number;
  actorEmail: string;
  action: string;
  target: string;
  at: string; // ISO timestamp
  href: string;
};

// Quick action records, defined statically in lib/search/quick-actions.ts
// and surfaced above content results when their label or hint fuzzy-
// matches the query.
export type QuickAction = {
  id: string;
  label: string;
  hint: string;
  href: string;
  // Minimum role to see the action. Filtered server-side at palette
  // open so we never even send actions the user can't take.
  minRole: "viewer" | "editor" | "admin";
};
