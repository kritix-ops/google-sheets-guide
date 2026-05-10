import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { AssignmentPanel } from "@/components/assignment-panel";
import {
  getAssignment,
  getLessonInfo,
  getLocalizedLessonTitle,
  loadLessonComponent,
} from "@/lib/content/registry";
import type { Locale } from "@/lib/i18n/routing";

type Props = { params: Promise<{ id: string; locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { id, locale } = await params;
  const info = getLessonInfo(id);
  const title = info
    ? getLocalizedLessonTitle(id, locale as Locale) ?? info.title
    : null;
  return {
    title: title ? `${title} — Sheets Guide` : "Lesson — Sheets Guide",
  };
}

export default async function LessonPage({ params }: Props) {
  const { id, locale } = await params;
  const info = getLessonInfo(id);
  const assignment = getAssignment(id);
  const loaded = await loadLessonComponent(id, locale as Locale);
  if (!info || !assignment || !loaded) notFound();

  const { Component: LessonBody, servedLocale } = loaded;
  const tTracks = await getTranslations("tracks");
  const tLesson = await getTranslations("lesson");

  const trackLabel = tTracks(`${info.track}.label`);
  const fellBackToEnglish = servedLocale === "en" && locale !== "en";

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 xl:grid-cols-[minmax(0,1fr)_360px]">
      <article className="min-w-0">
        <p className="mb-6 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {trackLabel} · {info.order.toString().padStart(2, "0")}
        </p>
        {fellBackToEnglish ? (
          <div
            role="status"
            className="mb-6 rounded-md border border-warning/40 bg-warning/10 px-4 py-2 text-xs text-warning"
            dir="auto"
          >
            <strong className="font-semibold">
              {tLesson("translationPending")}.
            </strong>{" "}
            {tLesson("viewInEnglish")}
          </div>
        ) : null}
        <div lang={servedLocale} dir={servedLocale === "he" ? "rtl" : "ltr"}>
          <LessonBody />
        </div>
      </article>

      <div className="min-w-0 xl:sticky xl:top-20 xl:self-start">
        <AssignmentPanel assignmentId={info.assignmentId} />
      </div>
    </div>
  );
}
