import {
  listAssignments,
  listLessonsByTrack,
  getLocalizedLessonTitle,
  isLessonTranslated,
} from "../lib/content/registry.ts";

const errors = [];
const warnings = [];

const lessons = listAssignments();
const byTrack = listLessonsByTrack();

if (lessons.length !== 80) errors.push(`Expected 80 assignments; got ${lessons.length}`);

const ids = lessons.map(l => l.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length > 0) errors.push(`Duplicate IDs: ${[...new Set(dupes)].join(", ")}`);

const idPattern = /^(formulas|modeling|apps-script|scale|ai)-\d{2}-[a-z0-9-]+$/;
for (const id of ids) if (!idPattern.test(id)) errors.push(`Bad ID format: ${id}`);

const expectedTracks = ["formulas", "modeling", "apps-script", "scale", "ai-in-sheets"];
const gotTracks = byTrack.map(t => t.track);
if (JSON.stringify(gotTracks) !== JSON.stringify(expectedTracks)) {
  errors.push(`Track order wrong. Expected ${expectedTracks.join(",")}; got ${gotTracks.join(",")}`);
}

const expectedCounts = { formulas: 28, modeling: 18, "apps-script": 17, scale: 11, "ai-in-sheets": 6 };
for (const t of byTrack) {
  if (t.lessons.length !== expectedCounts[t.track]) {
    errors.push(`Track ${t.track}: expected ${expectedCounts[t.track]} lessons; got ${t.lessons.length}`);
  }
  for (let i = 1; i < t.lessons.length; i++) {
    if (t.lessons[i].order <= t.lessons[i-1].order) {
      errors.push(`Track ${t.track}: order not strictly ascending at index ${i}`);
    }
  }
  const orders = t.lessons.map(l => l.order);
  const expected = Array.from({length: t.lessons.length}, (_, i) => i + 1);
  if (JSON.stringify(orders) !== JSON.stringify(expected)) {
    errors.push(`Track ${t.track}: order numbers should be 1..${t.lessons.length}; got ${orders.join(",")}`);
  }
}

const infoIds = byTrack.flatMap(t => t.lessons.map(l => l.assignmentId));
const assignIds = new Set(ids);
for (const infoId of infoIds) if (!assignIds.has(infoId)) errors.push(`LESSON_INFO id ${infoId} has no ASSIGNMENTS entry`);
for (const id of ids) if (!infoIds.includes(id)) errors.push(`ASSIGNMENTS id ${id} has no LESSON_INFO entry`);

for (const id of ids) {
  const heTitle = getLocalizedLessonTitle(id, "he");
  const enTitle = getLocalizedLessonTitle(id, "en");
  if (!enTitle) errors.push(`No EN title for ${id}`);
  if (!heTitle) warnings.push(`No HE title for ${id} (falls back to EN)`);
  if (!isLessonTranslated(id, "he")) warnings.push(`isLessonTranslated(${id}, "he") = false`);
}

console.log(`Lessons: ${lessons.length}`);
console.log(`Tracks: ${byTrack.length}`);
console.log(`Errors: ${errors.length}`);
errors.forEach(e => console.log("  ERR: " + e));
console.log(`Warnings: ${warnings.length}`);
warnings.forEach(w => console.log("  WARN: " + w));
console.log("---");
for (const t of byTrack) {
  console.log(`  ${t.track}: ${t.lessons.length} lessons (orders ${t.lessons[0].order}..${t.lessons[t.lessons.length-1].order})`);
}
