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
