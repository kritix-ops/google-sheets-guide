import { getTranslations } from "next-intl/server";

import { Link } from "@/lib/i18n/navigation";
import type { EditorTrackGroup } from "@/lib/content/source";

type DraftRow = {
  track: string;
  slug: string;
  lang: "en" | "he";
  updatedAt: Date;
};

export async function LessonTable({
  groups,
  myDrafts,
}: {
  groups: EditorTrackGroup[];
  myDrafts: DraftRow[];
}) {
  const t = await getTranslations("admin");
  const tTracks = await getTranslations("tracks");

  const draftByKey = new Map<string, { en?: Date; he?: Date }>();
  for (const d of myDrafts) {
    const key = `${d.track}/${d.slug}`;
    const entry = draftByKey.get(key) ?? {};
    entry[d.lang] = d.updatedAt;
    draftByKey.set(key, entry);
  }

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.track} className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {tTracks(`${group.track}.label`)}
          </h2>
          <div className="overflow-hidden rounded-md border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 text-start font-medium">#</th>
                  <th className="px-4 py-2 text-start font-medium">
                    {t("content.lesson")}
                  </th>
                  <th className="px-4 py-2 text-start font-medium">
                    {t("content.languages")}
                  </th>
                  <th className="px-4 py-2 text-start font-medium">
                    {t("content.drafts")}
                  </th>
                  <th className="px-4 py-2 text-end font-medium">
                    {t("content.actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.lessons.map((lesson) => {
                  const draftEntry = draftByKey.get(
                    `${lesson.track}/${lesson.slug}`,
                  );
                  return (
                    <tr key={lesson.assignmentId} className="border-t">
                      <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                        {lesson.order.toString().padStart(2, "0")}
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium">{lesson.title}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {lesson.track}/{lesson.slug}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <span className="inline-flex items-center gap-1">
                          {lesson.hasEn ? (
                            <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono">
                              EN
                            </span>
                          ) : null}
                          {lesson.hasHe ? (
                            <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono">
                              HE
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs">
                        <span className="inline-flex items-center gap-1">
                          {draftEntry?.en ? (
                            <span className="rounded-sm bg-warning/15 px-1.5 py-0.5 font-mono text-warning">
                              EN
                            </span>
                          ) : null}
                          {draftEntry?.he ? (
                            <span className="rounded-sm bg-warning/15 px-1.5 py-0.5 font-mono text-warning">
                              HE
                            </span>
                          ) : null}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-end">
                        <Link
                          href={`/admin/content/${lesson.track}/${lesson.slug}`}
                          className="text-xs text-foreground/80 underline-offset-2 hover:text-foreground hover:underline"
                        >
                          {t("content.edit")}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
