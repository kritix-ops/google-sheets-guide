import "server-only";

import { eq } from "drizzle-orm";
import { cache } from "react";

import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import type { LessonStatus, ProgressMap } from "@/lib/progress-utils";

export type { LessonProgress, LessonStatus, ProgressMap, TrackSummary } from "@/lib/progress-utils";
export { summarizeOverall, summarizeTrack } from "@/lib/progress-utils";

// Cached for the request lifetime so layout + page + lesson route share one
// DB read. React.cache is per-request; values do not leak between users.
export const getUserProgress = cache(
  async (userId: string | null | undefined): Promise<ProgressMap> => {
    if (!userId) return {};

    const rows = await db
      .select({
        slug: schema.attempts.assignmentSlug,
        attemptId: schema.attempts.id,
        score: schema.grades.score,
        passed: schema.grades.passed,
        gradedAt: schema.grades.gradedAt,
      })
      .from(schema.attempts)
      .leftJoin(
        schema.grades,
        eq(schema.grades.attemptId, schema.attempts.id),
      )
      .where(eq(schema.attempts.userId, userId));

    const map: ProgressMap = {};
    const seenAttempts = new Map<string, Set<number>>();
    for (const r of rows) {
      const slug = r.slug;
      const cur = map[slug] ?? {
        status: "not-started" as LessonStatus,
        attempts: 0,
      };

      const attemptSet = seenAttempts.get(slug) ?? new Set<number>();
      if (!attemptSet.has(r.attemptId)) {
        attemptSet.add(r.attemptId);
        cur.attempts += 1;
        seenAttempts.set(slug, attemptSet);
      }

      if (r.passed) {
        cur.status = "passed";
      } else if (cur.status === "not-started") {
        cur.status = "in-progress";
      }

      if (r.score != null) {
        cur.bestScore = Math.max(cur.bestScore ?? 0, r.score);
      }

      if (r.gradedAt != null) {
        const ms =
          r.gradedAt instanceof Date ? r.gradedAt.getTime() : r.gradedAt;
        cur.lastGradedAt = Math.max(cur.lastGradedAt ?? 0, ms);
      }

      map[slug] = cur;
    }
    return map;
  },
);

// Helper that fetches the session and resolves to a progress map for the
// signed-in user, or an empty map for unauthenticated requests. Suitable
// for server components.
export async function getProgressForCurrentUser(): Promise<ProgressMap> {
  const session = await auth();
  return getUserProgress(session?.user?.id);
}
