/**
 * Build script: read every lesson MDX file in content/{en,he}/lessons,
 * extract searchable entries, and write per-language JSON indexes into
 * public/search-index/. Run via `npm run build:search`, prepended to
 * `vercel-build` so production builds always ship a fresh index.
 */
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { extractLessonEntries } from "../lib/search/extract-lesson";
import type { LessonIndexEntry } from "../lib/search/types";
import {
  getLocalizedLessonTitle,
  listLessonsByTrack,
} from "../lib/content/registry";
import type { LessonLang } from "../lib/db/schema";

// Inlined from lib/content/source.ts to avoid pulling in the
// `server-only` import chain at Node-script time. The logic must stay
// in sync with the original: strip the track prefix off the
// assignmentId to recover the slug folder name.
function slugFromAssignmentId(assignmentId: string, track: string): string {
  const prefix = `${track}-`;
  return assignmentId.startsWith(prefix)
    ? assignmentId.slice(prefix.length)
    : assignmentId;
}

const REPO_ROOT = process.cwd();
const LANGS: LessonLang[] = ["en", "he"];

function lessonFilePath(
  lang: LessonLang,
  track: string,
  slug: string,
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

async function buildForLang(lang: LessonLang): Promise<LessonIndexEntry[]> {
  const groups = listLessonsByTrack();
  const entries: LessonIndexEntry[] = [];

  for (const group of groups) {
    for (const lesson of group.lessons) {
      const slug = slugFromAssignmentId(lesson.assignmentId, lesson.track);
      const file = lessonFilePath(lang, lesson.track, slug);
      if (!existsSync(file)) continue;
      const source = await readFile(file, "utf-8");
      const title =
        getLocalizedLessonTitle(lesson.assignmentId, lang) ?? lesson.title;
      const lessonEntries = extractLessonEntries({
        source,
        lang,
        track: lesson.track,
        trackLabel: group.label,
        slug,
        assignmentId: lesson.assignmentId,
        order: lesson.order,
        fallbackTitle: title,
      });
      entries.push(...lessonEntries);
    }
  }

  return entries;
}

async function main(): Promise<void> {
  const outDir = path.join(REPO_ROOT, "public", "search-index");
  await mkdir(outDir, { recursive: true });

  for (const lang of LANGS) {
    const entries = await buildForLang(lang);
    const outFile = path.join(outDir, `lessons-${lang}.json`);
    await writeFile(outFile, JSON.stringify(entries), "utf-8");
    const approxKB = Math.round(
      JSON.stringify(entries).length / 1024,
    );
    process.stdout.write(
      `[search-index] ${lang}: ${entries.length} entries, ${approxKB} KB → ${path.relative(
        REPO_ROOT,
        outFile,
      )}\n`,
    );
  }
}

main().catch((err) => {
  process.stderr.write(`[search-index] FAILED: ${(err as Error).stack ?? err}\n`);
  process.exit(1);
});
