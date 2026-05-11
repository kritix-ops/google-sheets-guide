"use server";

import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { listLessonsForEditor } from "@/lib/content/source";
import { db, schema } from "@/lib/db";
import type { LessonLang } from "@/lib/db/schema";

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
