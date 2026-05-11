"use client";

import { useEffect, useState, useTransition } from "react";

import {
  discardDraft,
  saveDraft,
} from "@/app/[locale]/admin/content/[track]/[slug]/actions";
import { Button } from "@/components/ui/button";
import type { LessonLang } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type LangData = {
  publishedSource: string | null;
  draft: { content: string; updatedAt: Date } | null;
  hasFile: boolean;
};

type Labels = {
  warningHeading: string;
  warningBody: string;
  publishedSource: string;
  draftSaved: string;
  unsavedChanges: string;
  neverEdited: string;
  save: string;
  discard: string;
  missingFile: string;
};

type Props = {
  track: string;
  slug: string;
  en: LangData;
  he: LangData;
  labels: Labels;
};

export function LessonEditor({ track, slug, en, he, labels }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border border-warning/40 bg-warning/10 p-4 text-sm text-warning">
        <div className="font-semibold">{labels.warningHeading}</div>
        <div className="mt-1 text-warning/90">{labels.warningBody}</div>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LangPane
          lang="en"
          data={en}
          track={track}
          slug={slug}
          labels={labels}
        />
        <LangPane
          lang="he"
          data={he}
          track={track}
          slug={slug}
          labels={labels}
        />
      </div>
    </div>
  );
}

function LangPane({
  lang,
  data,
  track,
  slug,
  labels,
}: {
  lang: LessonLang;
  data: LangData;
  track: string;
  slug: string;
  labels: Labels;
}) {
  const initial = data.draft?.content ?? data.publishedSource ?? "";
  const [content, setContent] = useState(initial);
  const [pending, startTransition] = useTransition();
  const isDirty = content !== initial;

  // When the server-side draft state updates (after a save), the parent
  // re-renders this pane with a new initial value. Sync local state to it.
  // This blows away unsaved local edits if `initial` shifts mid-typing,
  // but that only happens after a successful save round-trip on our own
  // action, so it's the right behavior.
  useEffect(() => {
    setContent(initial);
  }, [initial]);

  function handleSave() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("track", track);
      fd.set("slug", slug);
      fd.set("lang", lang);
      fd.set("content", content);
      await saveDraft(fd);
    });
  }

  function handleDiscard() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("track", track);
      fd.set("slug", slug);
      fd.set("lang", lang);
      await discardDraft(fd);
    });
  }

  if (!data.hasFile) {
    return (
      <section className="space-y-2">
        <PaneHeader lang={lang} />
        <div className="rounded-md border bg-muted/30 p-6 text-sm text-muted-foreground">
          {labels.missingFile}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <PaneHeader lang={lang} />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        dir={lang === "he" ? "rtl" : "ltr"}
        spellCheck={false}
        className={cn(
          "h-[70vh] w-full resize-none rounded-md border border-input bg-background p-3 font-mono text-xs leading-relaxed",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        )}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <StatusLabel isDirty={isDirty} draft={data.draft} labels={labels} />
        <div className="flex items-center gap-2">
          {data.draft ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              disabled={pending}
              className="h-7 text-xs"
            >
              {labels.discard}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={pending || !isDirty}
            className="h-7 text-xs"
          >
            {labels.save}
          </Button>
        </div>
      </div>
    </section>
  );
}

function PaneHeader({ lang }: { lang: LessonLang }) {
  return (
    <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
      {lang}
    </div>
  );
}

function StatusLabel({
  isDirty,
  draft,
  labels,
}: {
  isDirty: boolean;
  draft: { updatedAt: Date } | null;
  labels: Labels;
}) {
  if (isDirty) {
    return <span className="text-warning">{labels.unsavedChanges}</span>;
  }
  if (draft) {
    const ts = new Intl.DateTimeFormat("en-CA", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(draft.updatedAt);
    return (
      <span className="text-muted-foreground">
        {labels.draftSaved}: <span className="font-mono">{ts}</span>
      </span>
    );
  }
  return (
    <span className="text-muted-foreground">{labels.neverEdited}</span>
  );
}
