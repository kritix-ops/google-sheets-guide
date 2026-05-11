import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { LessonEditor } from "@/components/admin/lesson-editor";
import { requireRole } from "@/lib/auth/require-role";
import {
  getLessonRepoPath,
  listLessonsForEditor,
  readLessonSource,
} from "@/lib/content/source";
import { db, schema } from "@/lib/db";
import {
  getCurrentFileSha,
  PublishConfigError,
} from "@/lib/github/publish";
import type { LessonLang } from "@/lib/db/schema";

type Props = {
  params: Promise<{ locale: string; track: string; slug: string }>;
};

// Per-language publish availability. Publish is "available" only when we
// know the current SHA on main; anything else (no PAT, file absent
// upstream, transient GitHub failure) blocks publishing and surfaces a
// banner in the editor.
type PublishState =
  | { available: true; baseSha: string }
  | { available: false; reason: "missing_file" | "remote_missing" | "no_token" | "github_error" };

async function lookupPublishState(
  track: string,
  slug: string,
  lang: LessonLang,
  hasFile: boolean,
): Promise<PublishState> {
  if (!hasFile) return { available: false, reason: "missing_file" };
  try {
    const sha = await getCurrentFileSha(getLessonRepoPath(track, slug, lang));
    if (sha === null) return { available: false, reason: "remote_missing" };
    return { available: true, baseSha: sha };
  } catch (err) {
    if (err instanceof PublishConfigError) {
      return { available: false, reason: "no_token" };
    }
    return { available: false, reason: "github_error" };
  }
}

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

  const [enSource, heSource, enPublish, hePublish] = await Promise.all([
    readLessonSource(track, slug, "en"),
    readLessonSource(track, slug, "he"),
    lookupPublishState(track, slug, "en", lesson.hasEn),
    lookupPublishState(track, slug, "he", lesson.hasHe),
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
          publish: enPublish,
        }}
        he={{
          publishedSource: heSource,
          draft: draftMap.get("he") ?? null,
          hasFile: lesson.hasHe,
          publish: hePublish,
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
          publish: t("content.publish"),
          publishing: t("content.publishing"),
          publishSuccess: t("content.publishSuccess"),
          viewCommit: t("content.viewCommit"),
          publishDisabled: t("content.publishDisabled"),
          publishUnavailableNoToken: t("content.publishUnavailableNoToken"),
          publishUnavailableRemoteMissing: t(
            "content.publishUnavailableRemoteMissing",
          ),
          publishUnavailableGithubError: t(
            "content.publishUnavailableGithubError",
          ),
          conflictHeading: t("content.conflictHeading"),
          conflictBody: t("content.conflictBody"),
          mdxInvalidHeading: t("content.mdxInvalidHeading"),
          githubErrorHeading: t("content.githubErrorHeading"),
          configErrorHeading: t("content.configErrorHeading"),
          noDraftToPublish: t("content.noDraftToPublish"),
          preview: t("content.preview"),
          previewSaveFirst: t("content.previewSaveFirst"),
        }}
      />
    </div>
  );
}
