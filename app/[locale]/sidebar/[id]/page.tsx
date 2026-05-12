import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { SidebarCompanion } from "@/components/sidebar-companion";
import {
  SidebarLocaleSync,
  SidebarLocaleToggle,
} from "@/components/sidebar-locale-toggle";
import {
  getAssignment,
  getAssignmentTasks,
  getLessonInfo,
  getLocalizedLessonTitle,
  isLessonTranslated,
} from "@/lib/content/registry";
import { isRtl, type Locale } from "@/lib/i18n/routing";

// In-sheet sidebar surface — a focused assignment companion. Shows a
// per-task checklist, lets the user click "Check my work" to grade against
// the actual sheet, and reveals the canonical answer per task on demand.
// The full lesson body lives in the web app; the sidebar links to it.
//
// Public route — no session cookie reaches this page (cross-site iframe).
// The grade endpoint authorizes via the attemptId. See
// _plans/2026-05-10-option-b-sidebar.md.

type Props = {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ attemptId?: string; t?: string }>;
};

export default async function SidebarPage({ params, searchParams }: Props) {
  const { locale, id } = await params;
  const { attemptId: attemptIdRaw, t: attemptToken } = await searchParams;
  setRequestLocale(locale);

  const info = getLessonInfo(id);
  const assignment = getAssignment(id);
  const tasks = getAssignmentTasks(id);
  if (!info || !assignment || !tasks) notFound();

  const tSidebar = await getTranslations("sidebar");
  const attemptId = attemptIdRaw ? Number(attemptIdRaw) : null;
  if (
    attemptId == null ||
    Number.isNaN(attemptId) ||
    !attemptToken ||
    typeof attemptToken !== "string"
  ) {
    return (
      <div className="sc-empty">
        <p className="sc-empty-title">{tSidebar("missingAttemptTitle")}</p>
        <p className="sc-empty-body">{tSidebar("missingAttemptBody")}</p>
      </div>
    );
  }

  const lessonLocale: Locale = isLessonTranslated(id, locale as Locale)
    ? (locale as Locale)
    : "en";
  const dir = isRtl(lessonLocale) ? "rtl" : "ltr";
  const lessonHref = `/${lessonLocale}/lesson/${id}`;
  const tTracks = await getTranslations("tracks");
  const trackLabel = tTracks(`${info.track}.label`);
  const lessonTitle = getLocalizedLessonTitle(id, lessonLocale) ?? info.title;

  return (
    <div dir={dir} lang={lessonLocale}>
      <SidebarLocaleSync pathLocale={lessonLocale} />
      <SidebarCompanion
        assignmentId={assignment.id}
        attemptId={attemptId}
        attemptToken={attemptToken}
        tasks={tasks}
        lessonHref={lessonHref}
        lessonTitle={lessonTitle}
        trackLabel={trackLabel}
        lessonOrder={info.order}
        localeToggle={<SidebarLocaleToggle pathLocale={lessonLocale} />}
      />
    </div>
  );
}
