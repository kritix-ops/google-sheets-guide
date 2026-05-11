import "server-only";

import { and, desc, eq, isNull, like, or } from "drizzle-orm";

import { roleAtLeast, type AuthedUser } from "@/lib/auth/require-role";
import { db, schema } from "@/lib/db";
import type { AppRole } from "@/lib/db/schema";

import type {
  AdminAuditResult,
  AdminDraftResult,
  AdminSearchResponse,
  AdminUserResult,
} from "./types";

const PER_CATEGORY_LIMIT = 10;

// Escape LIKE wildcards from user input so a query of "%foo_bar%"
// doesn't behave specially. The Drizzle SQL builder parameterizes
// values, so we only need to escape these for the LIKE semantics.
function likeNeedle(raw: string): string {
  return `%${raw.replace(/[\\%_]/g, "\\$&")}%`;
}

export async function runAdminSearch(args: {
  query: string;
  actor: AuthedUser;
}): Promise<AdminSearchResponse> {
  const q = args.query.trim().slice(0, 200);
  if (q.length === 0) {
    return { users: [], drafts: [], audit: [] };
  }
  const needle = likeNeedle(q);
  const isAdmin = roleAtLeast(args.actor.role, "admin");

  const tasks: Promise<unknown>[] = [];

  // Users: admin-only (consistent with /admin/users page gate).
  let users: AdminUserResult[] = [];
  if (isAdmin) {
    tasks.push(
      db
        .select({
          email: schema.allowedUsers.email,
          role: schema.allowedUsers.role,
          note: schema.allowedUsers.note,
        })
        .from(schema.allowedUsers)
        .where(
          or(
            like(schema.allowedUsers.email, needle),
            like(schema.allowedUsers.note, needle),
          ),
        )
        .limit(PER_CATEGORY_LIMIT)
        .then((rows) => {
          users = rows.map((r) => ({
            email: r.email,
            role: r.role as AppRole,
            note: r.note,
            href: "/admin/users",
          }));
        }),
    );
  }

  // Drafts: editor+ sees their own drafts; admin sees all unpublished
  // drafts. Published drafts are surfaced via the audit log, so we
  // filter on publishedAt IS NULL here to keep the live view of work
  // in flight.
  let drafts: AdminDraftResult[] = [];
  const draftWhere = isAdmin
    ? and(
        isNull(schema.lessonDrafts.publishedAt),
        like(schema.lessonDrafts.content, needle),
      )
    : and(
        eq(schema.lessonDrafts.authorId, args.actor.userId),
        isNull(schema.lessonDrafts.publishedAt),
        like(schema.lessonDrafts.content, needle),
      );

  tasks.push(
    db
      .select({
        id: schema.lessonDrafts.id,
        track: schema.lessonDrafts.track,
        slug: schema.lessonDrafts.slug,
        lang: schema.lessonDrafts.lang,
        content: schema.lessonDrafts.content,
        updatedAt: schema.lessonDrafts.updatedAt,
        authorEmail: schema.users.email,
      })
      .from(schema.lessonDrafts)
      .leftJoin(
        schema.users,
        eq(schema.lessonDrafts.authorId, schema.users.id),
      )
      .where(draftWhere)
      .orderBy(desc(schema.lessonDrafts.updatedAt))
      .limit(PER_CATEGORY_LIMIT)
      .then((rows) => {
        drafts = rows.map((r) => ({
          id: r.id,
          track: r.track,
          slug: r.slug,
          lang: r.lang,
          snippet: makeSnippet(r.content, q),
          updatedAt: r.updatedAt.toISOString(),
          authorEmail: r.authorEmail ?? "",
          href: `/admin/content/${r.track}/${r.slug}`,
        }));
      }),
  );

  // Audit: admin-only. Match on actor email or target string.
  let audit: AdminAuditResult[] = [];
  if (isAdmin) {
    tasks.push(
      db
        .select({
          id: schema.adminAudit.id,
          actorEmail: schema.adminAudit.actorEmail,
          action: schema.adminAudit.action,
          target: schema.adminAudit.target,
          at: schema.adminAudit.at,
        })
        .from(schema.adminAudit)
        .where(
          or(
            like(schema.adminAudit.actorEmail, needle),
            like(schema.adminAudit.target, needle),
          ),
        )
        .orderBy(desc(schema.adminAudit.at))
        .limit(PER_CATEGORY_LIMIT)
        .then((rows) => {
          audit = rows.map((r) => ({
            id: r.id,
            actorEmail: r.actorEmail,
            action: r.action,
            target: r.target,
            at: r.at.toISOString(),
            href: `/admin/audit?action=${encodeURIComponent(r.action)}`,
          }));
        }),
    );
  }

  await Promise.all(tasks);
  return { users, drafts, audit };
}

// Pull a window of characters around the first match in the content so
// the result row has context, not just the title. ~120 chars on each
// side keeps the row visually small without losing the why-it-matched.
function makeSnippet(content: string, query: string): string {
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx < 0) {
    return content.slice(0, 200).trim();
  }
  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, idx + query.length + 60);
  const prefix = start > 0 ? "... " : "";
  const suffix = end < content.length ? " ..." : "";
  return `${prefix}${content.slice(start, end).replace(/\s+/g, " ")}${suffix}`;
}
