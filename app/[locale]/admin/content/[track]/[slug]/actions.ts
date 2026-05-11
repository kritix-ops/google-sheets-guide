"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import {
  getLessonRepoPath,
  listLessonsForEditor,
} from "@/lib/content/source";
import { db, schema } from "@/lib/db";
import type { LessonLang } from "@/lib/db/schema";
import { validateMdx } from "@/lib/github/mdx-validate";
import { publishFile, type PublishResult } from "@/lib/github/publish";

const LANGS: LessonLang[] = ["en", "he"];

function parseLang(raw: FormDataEntryValue | null): LessonLang | null {
  if (typeof raw !== "string") return null;
  return LANGS.includes(raw as LessonLang) ? (raw as LessonLang) : null;
}

// Guard against path traversal in the URL params. A request to
// /admin/content/../../../etc would otherwise reach the disk read.
function assertValidLesson(track: string, slug: string): void {
  const groups = listLessonsForEditor();
  const found = groups.some((g) =>
    g.lessons.some((l) => l.track === track && l.slug === slug),
  );
  if (!found) throw new Error(`Unknown lesson: ${track}/${slug}`);
}

export async function saveDraft(formData: FormData): Promise<void> {
  const actor = await requireRole("editor");
  const track = String(formData.get("track") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const lang = parseLang(formData.get("lang"));
  const content = formData.get("content");

  if (!track || !slug) throw new Error("Missing lesson identifier");
  if (!lang) throw new Error("Invalid language");
  if (typeof content !== "string") throw new Error("Invalid content");
  assertValidLesson(track, slug);

  // Upsert: at most one active draft per (track, slug, lang, author).
  const existing = await db.query.lessonDrafts.findFirst({
    where: and(
      eq(schema.lessonDrafts.track, track),
      eq(schema.lessonDrafts.slug, slug),
      eq(schema.lessonDrafts.lang, lang),
      eq(schema.lessonDrafts.authorId, actor.userId),
      isNull(schema.lessonDrafts.publishedAt),
    ),
  });

  if (existing) {
    await db
      .update(schema.lessonDrafts)
      .set({ content, updatedAt: new Date() })
      .where(eq(schema.lessonDrafts.id, existing.id));
  } else {
    await db.insert(schema.lessonDrafts).values({
      track,
      slug,
      lang,
      content,
      authorId: actor.userId,
    });
  }

  revalidatePath("/[locale]/admin/content/[track]/[slug]", "page");
  revalidatePath("/[locale]/admin/content", "page");
}

export async function discardDraft(formData: FormData): Promise<void> {
  const actor = await requireRole("editor");
  const track = String(formData.get("track") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const lang = parseLang(formData.get("lang"));

  if (!track || !slug) throw new Error("Missing lesson identifier");
  if (!lang) throw new Error("Invalid language");
  assertValidLesson(track, slug);

  await db
    .delete(schema.lessonDrafts)
    .where(
      and(
        eq(schema.lessonDrafts.track, track),
        eq(schema.lessonDrafts.slug, slug),
        eq(schema.lessonDrafts.lang, lang),
        eq(schema.lessonDrafts.authorId, actor.userId),
        isNull(schema.lessonDrafts.publishedAt),
      ),
    );

  revalidatePath("/[locale]/admin/content/[track]/[slug]", "page");
  revalidatePath("/[locale]/admin/content", "page");
}

export type PublishActionResult =
  | { ok: true; commitSha: string; commitUrl: string }
  | { ok: false; reason: "no_draft" }
  | { ok: false; reason: "mdx_invalid"; message: string }
  | { ok: false; reason: "conflict"; currentSha: string | null }
  | { ok: false; reason: "github_error"; status: number; message: string }
  | { ok: false; reason: "config_error"; message: string };

export async function publishDraft(
  formData: FormData,
): Promise<PublishActionResult> {
  const actor = await requireRole("editor");
  const track = String(formData.get("track") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const lang = parseLang(formData.get("lang"));
  const expectedBaseShaRaw = formData.get("baseSha");
  const expectedBaseSha =
    typeof expectedBaseShaRaw === "string" && expectedBaseShaRaw.length > 0
      ? expectedBaseShaRaw
      : null;

  if (!track || !slug) throw new Error("Missing lesson identifier");
  if (!lang) throw new Error("Invalid language");
  assertValidLesson(track, slug);

  const draft = await db.query.lessonDrafts.findFirst({
    where: and(
      eq(schema.lessonDrafts.track, track),
      eq(schema.lessonDrafts.slug, slug),
      eq(schema.lessonDrafts.lang, lang),
      eq(schema.lessonDrafts.authorId, actor.userId),
      isNull(schema.lessonDrafts.publishedAt),
    ),
  });
  if (!draft) {
    return { ok: false, reason: "no_draft" };
  }

  const validation = await validateMdx(draft.content);
  if (!validation.ok) {
    return { ok: false, reason: "mdx_invalid", message: validation.message };
  }

  const repoPath = getLessonRepoPath(track, slug, lang);
  const commitMessage = buildCommitMessage({
    track,
    slug,
    lang,
    authorName: actor.name ?? actor.email,
    authorEmail: actor.email,
  });

  const result: PublishResult = await publishFile({
    repoPath,
    content: draft.content,
    expectedBaseSha,
    commitMessage,
  });

  if (!result.ok) {
    if (result.reason === "conflict") {
      return { ok: false, reason: "conflict", currentSha: result.currentSha };
    }
    if (result.reason === "github_error") {
      return {
        ok: false,
        reason: "github_error",
        status: result.status,
        message: result.message,
      };
    }
    return {
      ok: false,
      reason: "config_error",
      message: result.message,
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(schema.lessonDrafts)
      .set({
        publishedAt: new Date(),
        publishedCommit: result.commitSha,
      })
      .where(eq(schema.lessonDrafts.id, draft.id));
    await tx.insert(schema.adminAudit).values({
      actorId: actor.userId,
      actorEmail: actor.email,
      action: "content.publish",
      target: `${track}/${slug}/${lang}`,
      beforeJson: { baseSha: expectedBaseSha },
      afterJson: {
        commitSha: result.commitSha,
        commitUrl: result.commitUrl,
        newFileSha: result.newFileSha,
      },
    });
  });

  revalidatePath("/[locale]/admin/content/[track]/[slug]", "page");
  revalidatePath("/[locale]/admin/content", "page");

  return {
    ok: true,
    commitSha: result.commitSha,
    commitUrl: result.commitUrl,
  };
}

// Editor name + email come from the session. The PAT owner is the git
// author by default; Co-Authored-By attributes the actual editor. If the
// editor's email matches a verified GitHub account, the trailer surfaces
// them in the commit UI; otherwise it stays as plain text, still useful
// for audit.
function buildCommitMessage(args: {
  track: string;
  slug: string;
  lang: LessonLang;
  authorName: string;
  authorEmail: string;
}): string {
  const safeName = sanitizeTrailerField(args.authorName);
  const safeEmail = sanitizeTrailerField(args.authorEmail);
  const subject = `Update ${args.track}/${args.slug} (${args.lang})`;
  const body = `Edited via /admin/content by ${safeName}.`;
  const trailer = `Co-Authored-By: ${safeName} <${safeEmail}>`;
  return `${subject}\n\n${body}\n\n${trailer}\n`;
}

// Strip characters that would break a git trailer (newlines, angle
// brackets) and clamp length. Conservative; we never inject editor input
// into a shell, just into a JSON request body that GitHub stores as the
// commit message.
function sanitizeTrailerField(value: string): string {
  return value
    .replace(/[\r\n<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}
