import "server-only";

import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { LessonLang } from "@/lib/db/schema";

import { listLessonsByTrack } from "./registry";

const REPO_ROOT = process.cwd();

// Map a (track, slug, lang) triple to the absolute MDX file path. The
// registry's lesson info already encodes track + assignmentId; the slug
// here is the directory name under the track (e.g. "01-grid-model"), which
// we derive by stripping the track prefix off the assignmentId.
export function getLessonFilePath(
  track: string,
  slug: string,
  lang: LessonLang,
): string {
  return path.join(
    REPO_ROOT,
    "content",
    lang,
    "lessons",
    track,
    slug,
    "lesson.mdx",
  );
}

// Repo-relative POSIX path for the same lesson file. Used by the GitHub
// Contents API, which requires forward-slash paths regardless of host OS.
export function getLessonRepoPath(
  track: string,
  slug: string,
  lang: LessonLang,
): string {
  return `content/${lang}/lessons/${track}/${slug}/lesson.mdx`;
}

export function lessonFileExists(
  track: string,
  slug: string,
  lang: LessonLang,
): boolean {
  return existsSync(getLessonFilePath(track, slug, lang));
}

export async function readLessonSource(
  track: string,
  slug: string,
  lang: LessonLang,
): Promise<string | null> {
  const filePath = getLessonFilePath(track, slug, lang);
  if (!existsSync(filePath)) return null;
  return readFile(filePath, "utf-8");
}

// The assignment ID encodes track + slug as "track-slug" but the track
// name itself can contain dashes ("apps-script", "ai-in-sheets"). The
// registry tells us which track owns the assignment, so we just strip the
// known track prefix.
export function slugFromAssignmentId(assignmentId: string, track: string): string {
  const prefix = `${track}-`;
  if (!assignmentId.startsWith(prefix)) return assignmentId;
  return assignmentId.slice(prefix.length);
}

export type EditorLessonEntry = {
  assignmentId: string;
  track: string;
  slug: string;
  order: number;
  title: string;
  hasEn: boolean;
  hasHe: boolean;
};

export type EditorTrackGroup = {
  track: string;
  label: string;
  lessons: EditorLessonEntry[];
};

// Enumerate every lesson the editor can touch, with file-presence flags
// per language. Source of truth = the registry; presence check = file
// system. A lesson missing the Hebrew file is still listed (editor sees
// it as "EN only"); editor cannot create a missing-language file from the
// UI in v1.
export function listLessonsForEditor(): EditorTrackGroup[] {
  const groups = listLessonsByTrack();
  return groups.map((group) => ({
    track: group.track,
    label: group.label,
    lessons: group.lessons.map((lesson) => {
      const slug = slugFromAssignmentId(lesson.assignmentId, lesson.track);
      return {
        assignmentId: lesson.assignmentId,
        track: lesson.track,
        slug,
        order: lesson.order,
        title: lesson.title,
        hasEn: lessonFileExists(lesson.track, slug, "en"),
        hasHe: lessonFileExists(lesson.track, slug, "he"),
      };
    }),
  }));
}
