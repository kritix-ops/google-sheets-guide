import { type LessonInfo } from "@/lib/content/registry";

export type LessonStatus = "not-started" | "in-progress" | "passed";

export type LessonProgress = {
  status: LessonStatus;
  bestScore?: number;
  lastGradedAt?: number;
  attempts: number;
};

export type ProgressMap = Record<string, LessonProgress>;

export type TrackSummary = {
  passed: number;
  inProgress: number;
  total: number;
  percent: number;
};

export function summarizeTrack(
  lessons: LessonInfo[],
  progress: ProgressMap,
): TrackSummary {
  let passed = 0;
  let inProgress = 0;
  for (const l of lessons) {
    const p = progress[l.assignmentId];
    if (p?.status === "passed") passed++;
    else if (p?.status === "in-progress") inProgress++;
  }
  const total = lessons.length;
  const percent = total === 0 ? 0 : Math.round((passed / total) * 100);
  return { passed, inProgress, total, percent };
}

export function summarizeOverall(
  tracks: Array<{ lessons: LessonInfo[] }>,
  progress: ProgressMap,
): TrackSummary {
  let passed = 0;
  let inProgress = 0;
  let total = 0;
  for (const t of tracks) {
    const s = summarizeTrack(t.lessons, progress);
    passed += s.passed;
    inProgress += s.inProgress;
    total += s.total;
  }
  const percent = total === 0 ? 0 : Math.round((passed / total) * 100);
  return { passed, inProgress, total, percent };
}
