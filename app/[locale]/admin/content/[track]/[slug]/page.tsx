import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LessonEditor } from "@/components/admin/lesson-editor";
import { requireRole } from "@/lib/auth/require-role";
import {
  listLessonsForEditor,
  readLessonSource,
} from "@/lib/content/source";
import { db, schema } from "@/lib/db";

type Props = {
  params: Promise<{ locale: string; track: string; slug: string }>;
};

export default async function LessonEditorPage({ params }: Props) {
  const { track, slug } = await params;
  const me = await requireRole("editor");
  const t = await getTranslations("admin");

  // Validate the (track, slug) maps to a real lesson. Defense against path
  // traversal AND a nice 404 for typos.
  const groups = listLessonsForEditor();
  const lesson = groups
    .flatMap((g) => g.lessons)
    .find((l) => l.track === track && l.slug === slug);
  if (!lesson) notFound();

  const [enSource, heSource] = await Promise.all([
    readLessonSource(track, slug, "en"),
    readLessonSource(track, slug, "he"),
  ]);

  const myDrafts = await db
    .select({
      lang: schema.lessonDrafts.lang,
      content: schema.lessonDrafts.content,
      updatedAt: schema.lessonDrafts.updatedAt,
    })
    .from(schema.lessonDrafts)
    .where(
      and(
        eq(schema.lessonDrafts.track, track),
        eq(schema.lessonDrafts.slug, slug),
        eq(schema.lessonDrafts.authorId, me.userId),
        isNull(schema.lessonDrafts.publishedAt),
      ),
    );

  const draftMap = new Map(myDrafts.map((d) => [d.lang, d]));

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          {track}/{slug}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {lesson.title}
        </h1>
      </header>
      <LessonEditor
        track={track}
        slug={slug}
        en={{
          publishedSource: enSource,
          draft: draftMap.get("en") ?? null,
          hasFile: lesson.hasEn,
        }}
        he={{
          publishedSource: heSource,
          draft: draftMap.get("he") ?? null,
          hasFile: lesson.hasHe,
        }}
        labels={{
          warningHeading: t("content.warningHeading"),
          warningBody: t("content.warningBody"),
          publishedSource: t("content.publishedSource"),
          draftSaved: t("content.draftSaved"),
          unsavedChanges: t("content.unsavedChanges"),
          neverEdited: t("content.neverEdited"),
          save: t("content.save"),
          discard: t("content.discard"),
          missingFile: t("content.missingFile"),
        }}
      />
    </div>
  );
}
