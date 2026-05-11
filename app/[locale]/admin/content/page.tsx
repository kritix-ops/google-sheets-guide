import { and, eq, isNull } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

import { LessonTable } from "@/components/admin/lesson-table";
import { requireRole } from "@/lib/auth/require-role";
import { listLessonsForEditor } from "@/lib/content/source";
import { db, schema } from "@/lib/db";

export default async function ContentAdminPage() {
  const me = await requireRole("editor");
  const t = await getTranslations("admin");

  const groups = listLessonsForEditor();
  // Active drafts owned by the current user. Published rows stay for
  // audit but should not badge a lesson as "in draft".
  const myDrafts = await db
    .select({
      track: schema.lessonDrafts.track,
      slug: schema.lessonDrafts.slug,
      lang: schema.lessonDrafts.lang,
      updatedAt: schema.lessonDrafts.updatedAt,
    })
    .from(schema.lessonDrafts)
    .where(
      and(
        eq(schema.lessonDrafts.authorId, me.userId),
        isNull(schema.lessonDrafts.publishedAt),
      ),
    );

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("content.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("content.description")}
        </p>
      </header>
      <LessonTable groups={groups} myDrafts={myDrafts} />
    </div>
  );
}
