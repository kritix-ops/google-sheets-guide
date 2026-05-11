import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { requireRole } from "@/lib/auth/require-role";
import { listLessonsForEditor } from "@/lib/content/source";
import { renderMdx } from "@/lib/content/render-mdx";
import { db, schema } from "@/lib/db";
import type { LessonLang } from "@/lib/db/schema";

type Props = {
  params: Promise<{ locale: string; track: string; slug: string }>;
  searchParams: Promise<{ lang?: string }>;
};

function parseLang(raw: string | undefined): LessonLang | null {
  if (raw === "en" || raw === "he") return raw;
  return null;
}

export default async function LessonPreviewPage({
  params,
  searchParams,
}: Props) {
  const { track, slug } = await params;
  const { lang: langRaw } = await searchParams;
  const me = await requireRole("editor");
  const t = await getTranslations("admin");

  // Validate (track, slug) against the registry. Defense against path
  // traversal and a clean 404 for typos.
  const groups = listLessonsForEditor();
  const lesson = groups
    .flatMap((g) => g.lessons)
    .find((l) => l.track === track && l.slug === slug);
  if (!lesson) notFound();

  const lang = parseLang(langRaw);
  if (!lang) notFound();

  const draft = await db.query.lessonDrafts.findFirst({
    where: and(
      eq(schema.lessonDrafts.track, track),
      eq(schema.lessonDrafts.slug, slug),
      eq(schema.lessonDrafts.lang, lang),
      eq(schema.lessonDrafts.authorId, me.userId),
      isNull(schema.lessonDrafts.publishedAt),
    ),
  });

  const result = draft ? await renderMdx(draft.content) : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="border-b border-warning/40 bg-warning/10 px-6 py-3 text-sm text-warning"
        role="status"
      >
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
          <div>
            <strong className="font-semibold">
              {t("preview.banner")}
            </strong>{" "}
            <span className="text-warning/90">
              {t("preview.bannerBody", {
                track,
                slug,
                lang: lang.toUpperCase(),
              })}
            </span>
          </div>
          <div className="text-xs text-warning/80">
            {draft
              ? new Intl.DateTimeFormat("en-CA", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(draft.updatedAt)
              : null}
          </div>
        </div>
      </div>

      <article
        className="mx-auto max-w-4xl px-6 py-12"
        lang={lang}
        dir={lang === "he" ? "rtl" : "ltr"}
      >
        {!draft ? (
          <EmptyState message={t("preview.noDraft")} />
        ) : result?.ok ? (
          <result.Component />
        ) : result ? (
          <RenderError
            heading={t("preview.compileErrorHeading")}
            detail={result.message}
          />
        ) : null}
      </article>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function RenderError({
  heading,
  detail,
}: {
  heading: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
      <div className="mb-2 font-semibold">{heading}</div>
      <pre className="whitespace-pre-wrap font-mono text-xs">{detail}</pre>
    </div>
  );
}
