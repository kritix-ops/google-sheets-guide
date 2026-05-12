import {
  getLocalizedLessonTitle,
  isLessonTranslated,
  listAssignments,
  listLessonsByTrack,
} from "../lib/content/registry";

// Curriculum schema check. Run via `npm run registry:check`. Verifies that
// the lesson registry matches expected counts and IDs, that EN titles
// exist for every lesson, and that track ordering is contiguous. Exits
// with a non-zero status when any errors are found (warnings do not
// affect exit status).

const errors: string[] = [];
const warnings: string[] = [];

const lessons = listAssignments();
const byTrack = listLessonsByTrack();

// Expected total: 28 + 18 + 17 + 12 + 6 + 1 = 82. Adjust if a new lesson lands.
if (lessons.length !== 82) {
  errors.push(`Expected 82 assignments; got ${lessons.length}`);
}

const ids = lessons.map((l) => l.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length > 0) {
  errors.push(`Duplicate IDs: ${[...new Set(dupes)].join(", ")}`);
}

// ID format allows an optional trailing letter on the numeric segment for
// out-of-band lessons like `scale-03b-splitting-workbook`.
const idPattern =
  /^(formulas|modeling|apps-script|scale|ai|capstone)-\d{2}[a-z]?-[a-z0-9-]+$/;
for (const id of ids) {
  if (!idPattern.test(id)) errors.push(`Bad ID format: ${id}`);
}

const expectedTracks = [
  "formulas",
  "modeling",
  "apps-script",
  "scale",
  "ai-in-sheets",
  "capstone",
] as const;
const gotTracks = byTrack.map((t) => t.track);
if (JSON.stringify(gotTracks) !== JSON.stringify(expectedTracks)) {
  errors.push(
    `Track order wrong. Expected ${expectedTracks.join(",")}; got ${gotTracks.join(",")}`,
  );
}

const expectedCounts: Record<string, number> = {
  formulas: 28,
  modeling: 18,
  "apps-script": 17,
  scale: 12,
  "ai-in-sheets": 6,
  capstone: 1,
};
for (const t of byTrack) {
  const want = expectedCounts[t.track];
  if (want != null && t.lessons.length !== want) {
    errors.push(
      `Track ${t.track}: expected ${want} lessons; got ${t.lessons.length}`,
    );
  }
  // Order numbers must be strictly ascending. Fractional orders are
  // allowed for out-of-band lessons (e.g. scale-03b sits at 3.5).
  for (let i = 1; i < t.lessons.length; i++) {
    if (t.lessons[i]!.order <= t.lessons[i - 1]!.order) {
      errors.push(`Track ${t.track}: order not strictly ascending at index ${i}`);
    }
  }
}

const infoIds = byTrack.flatMap((t) => t.lessons.map((l) => l.assignmentId));
const assignIds = new Set(ids);
for (const infoId of infoIds) {
  if (!assignIds.has(infoId)) {
    errors.push(`LESSON_INFO id ${infoId} has no ASSIGNMENTS entry`);
  }
}
for (const id of ids) {
  if (!infoIds.includes(id)) {
    errors.push(`ASSIGNMENTS id ${id} has no LESSON_INFO entry`);
  }
}

for (const id of ids) {
  const heTitle = getLocalizedLessonTitle(id, "he");
  const enTitle = getLocalizedLessonTitle(id, "en");
  if (!enTitle) errors.push(`No EN title for ${id}`);
  if (!heTitle) warnings.push(`No HE title for ${id} (falls back to EN)`);
  if (!isLessonTranslated(id, "he")) {
    warnings.push(`isLessonTranslated(${id}, "he") = false`);
  }
}

console.log(`Lessons: ${lessons.length}`);
console.log(`Tracks: ${byTrack.length}`);
console.log(`Errors: ${errors.length}`);
errors.forEach((e) => console.log("  ERR: " + e));
console.log(`Warnings: ${warnings.length}`);
warnings.forEach((w) => console.log("  WARN: " + w));
console.log("---");
for (const t of byTrack) {
  const first = t.lessons[0]?.order ?? 0;
  const last = t.lessons[t.lessons.length - 1]?.order ?? 0;
  console.log(`  ${t.track}: ${t.lessons.length} lessons (orders ${first}..${last})`);
}

if (errors.length > 0) process.exit(1);
