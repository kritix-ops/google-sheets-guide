import { sql } from "drizzle-orm";
import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

// Auth.js tables — column names and types match @auth/drizzle-adapter contract.

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

// App tables. Lessons + assignments live in content/ as files;
// only per-user state is persisted here.

export const attempts = sqliteTable("attempt", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  assignmentSlug: text("assignment_slug").notNull(),
  sheetId: text("sheet_id").notNull(),
  // Bound Apps Script project ID. Populated after the start route's
  // sidebar provisioner runs. Track 3 graders read the project's source
  // via this ID.
  scriptId: text("script_id"),
  startedAt: integer("started_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const grades = sqliteTable("grade", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  attemptId: integer("attempt_id")
    .notNull()
    .references(() => attempts.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  passed: integer("passed", { mode: "boolean" }).notNull(),
  gradedBy: text("graded_by")
    .$type<"rules" | "claude" | "both">()
    .notNull(),
  feedback: text("feedback", { mode: "json" })
    .$type<{
      summary: string;
      checks: Array<{
        ruleId: string;
        name: string;
        passed: boolean;
        weight: number;
        detail?: string;
      }>;
    }>()
    .notNull(),
  gradedAt: integer("graded_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// Admin access control. `allowedUsers` is the single source of truth for
// who can sign in and what role they hold. Keyed by email because the
// row exists before a user has ever signed in (and thus before the
// NextAuth-managed `users` row exists). Role determines admin / editor /
// viewer capabilities; viewers can read lessons but have no admin UI.
//
// Bootstrap path: when this table is empty, emails in the env var
// `AUTH_INITIAL_ADMINS` are seeded as admins on first successful sign-in.

export type AppRole = "admin" | "editor" | "viewer";

export const allowedUsers = sqliteTable("allowed_user", {
  email: text("email").primaryKey(),
  role: text("role").$type<AppRole>().notNull(),
  addedBy: text("added_by").references(() => users.id, { onDelete: "set null" }),
  addedAt: integer("added_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  // Optional admin-visible note for context ("guest editor, May 2026").
  note: text("note"),
});

// Audit log for admin actions. Survives user deletion (actor email is
// denormalized). beforeJson / afterJson capture the change for forensics.

export type AdminAction =
  | "user.add"
  | "user.remove"
  | "user.role_change"
  | "content.publish"
  | "bootstrap.initial_admin";

export const adminAudit = sqliteTable("admin_audit", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actorId: text("actor_id").references(() => users.id, { onDelete: "set null" }),
  actorEmail: text("actor_email").notNull(),
  action: text("action").$type<AdminAction>().notNull(),
  // For user.* actions: the email being acted on.
  // For content.publish: "track/slug/lang".
  target: text("target").notNull(),
  beforeJson: text("before_json", { mode: "json" }).$type<unknown>(),
  afterJson: text("after_json", { mode: "json" }).$type<unknown>(),
  at: integer("at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

// Per-author lesson drafts. Source of truth for published lessons stays as
// MDX files in the repo; this table holds in-flight edits before they are
// pushed to git. Each editor has their own draft per (track, slug, lang);
// the second editor to publish overwrites the first.

export type LessonLang = "en" | "he";

export const lessonDrafts = sqliteTable("lesson_draft", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Track folder name: formulas, modeling, apps-script, scale, ai-in-sheets.
  track: text("track").notNull(),
  // Lesson folder name within the track: e.g. "01-grid-model".
  slug: text("slug").notNull(),
  lang: text("lang").$type<LessonLang>().notNull(),
  // Full proposed MDX content for the lesson.
  content: text("content").notNull(),
  authorId: text("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  // Null until published; then captures the git commit SHA that landed
  // this version on main.
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  publishedCommit: text("published_commit"),
});
