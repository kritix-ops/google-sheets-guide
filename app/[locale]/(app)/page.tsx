import { getLocale, getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { OverallProgressCard } from "@/components/overall-progress-card";
import { TrackList } from "@/components/track-list";
import { buttonVariants } from "@/components/ui/button";
import {
  getLocalizedLessonTitle,
  listLessonsByTrack,
} from "@/lib/content/registry";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import {
  getProgressForCurrentUser,
  summarizeOverall,
} from "@/lib/progress";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const session = await auth();
  const locale = (await getLocale()) as Locale;
  const tracks = listLessonsByTrack();
  const progress = await getProgressForCurrentUser();
  const overall = summarizeOverall(tracks, progress);
  const tHome = await getTranslations("home");
  const tApp = await getTranslations("app");

  const allLessons = tracks
    .flatMap((t) => t.lessons)
    .sort((a, b) => a.order - b.order);
  // Resume the first not-yet-passed lesson; fall back to the very first lesson
  // so a user who has finished everything still has a button.
  const resumeLesson =
    allLessons.find(
      (l) => (progress[l.assignmentId]?.status ?? "not-started") !== "passed",
    ) ?? allLessons[0];
  const resumeTitle = resumeLesson
    ? getLocalizedLessonTitle(resumeLesson.assignmentId, locale) ??
      resumeLesson.title
    : null;

  const firstName = session?.user?.name?.split(" ")[0];

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <header>
        <p className="text-sm text-muted-foreground">
          {firstName
            ? tHome("welcomeWithName", { name: firstName })
            : tHome("welcome")}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {tApp("tagline")}
        </h1>
        <p className="mt-2 max-w-prose text-base text-muted-foreground">
          {tHome("intro")}
        </p>
        {resumeLesson && resumeTitle ? (
          <Link
            href={`/lesson/${resumeLesson.assignmentId}`}
            className={cn(buttonVariants(), "mt-4")}
          >
            {tHome("startWith", { title: resumeTitle })}
          </Link>
        ) : null}
      </header>

      <OverallProgressCard summary={overall} />

      <TrackList tracks={tracks} progress={progress} />
    </div>
  );
}
