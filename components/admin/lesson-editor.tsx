"use client";

import { useEffect, useState, useTransition } from "react";

import {
  discardDraft,
  publishDraft,
  type PublishActionResult,
  saveDraft,
} from "@/app/[locale]/admin/content/[track]/[slug]/actions";
import { Button } from "@/components/ui/button";
import type { LessonLang } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

type PublishState =
  | { available: true; baseSha: string }
  | {
      available: false;
      reason:
        | "missing_file"
        | "remote_missing"
        | "no_token"
        | "github_error";
    };

type LangData = {
  publishedSource: string | null;
  draft: { content: string; updatedAt: Date } | null;
  hasFile: boolean;
  publish: PublishState;
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
  publish: string;
  publishing: string;
  publishSuccess: string;
  viewCommit: string;
  publishDisabled: string;
  publishUnavailableNoToken: string;
  publishUnavailableRemoteMissing: string;
  publishUnavailableGithubError: string;
  conflictHeading: string;
  conflictBody: string;
  mdxInvalidHeading: string;
  githubErrorHeading: string;
  configErrorHeading: string;
  noDraftToPublish: string;
  preview: string;
  previewSaveFirst: string;
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
  const [publishResult, setPublishResult] =
    useState<PublishActionResult | null>(null);
  const isDirty = content !== initial;

  // When the server-side draft state updates (after a save or publish),
  // the parent re-renders this pane with a new initial value. Sync local
  // state to it. This blows away unsaved local edits if `initial` shifts
  // mid-typing, but that only happens after a successful save round-trip
  // on our own action, so it's the right behavior.
  useEffect(() => {
    setContent(initial);
  }, [initial]);

  function handleSave() {
    setPublishResult(null);
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
    setPublishResult(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("track", track);
      fd.set("slug", slug);
      fd.set("lang", lang);
      await discardDraft(fd);
    });
  }

  function handlePublish() {
    if (!data.publish.available) return;
    setPublishResult(null);
    startTransition(async () => {
      // If the editor has unsaved local edits, persist them first so we
      // publish what they currently see, not yesterday's draft.
      if (isDirty) {
        const saveFd = new FormData();
        saveFd.set("track", track);
        saveFd.set("slug", slug);
        saveFd.set("lang", lang);
        saveFd.set("content", content);
        await saveDraft(saveFd);
      }
      const fd = new FormData();
      fd.set("track", track);
      fd.set("slug", slug);
      fd.set("lang", lang);
      if (data.publish.available) {
        fd.set("baseSha", data.publish.baseSha);
      }
      const result = await publishDraft(fd);
      setPublishResult(result);
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

  // Publish is enabled when (a) GitHub is reachable for this file, AND
  // (b) the editor has a saved draft (or unsaved local edits to save).
  // We don't gate on isDirty alone: a clean draft saved earlier is a
  // legitimate publish target.
  const hasPublishableContent = Boolean(data.draft) || isDirty;
  const publishEnabled = data.publish.available && hasPublishableContent;

  // Preview reads the saved draft from the DB, so unsaved local edits
  // would not be reflected. Either gate on no-dirt, or autosave first.
  // We keep it simple: only enable Preview when a saved draft exists and
  // local content matches it. The tooltip explains the "save first" rule.
  const previewEnabled = Boolean(data.draft) && !isDirty;
  const previewHref = `/admin/content/${track}/${slug}/preview?lang=${lang}`;

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
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={pending || !isDirty}
            className="h-7 text-xs"
          >
            {labels.save}
          </Button>
          {previewEnabled ? (
            <a
              href={previewHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-7 items-center rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {labels.preview}
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-7 cursor-not-allowed items-center rounded-md border border-input bg-background px-3 text-xs font-medium opacity-50"
              title={labels.previewSaveFirst}
            >
              {labels.preview}
            </button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handlePublish}
            disabled={pending || !publishEnabled}
            className="h-7 text-xs"
            title={publishEnabled ? undefined : labels.publishDisabled}
          >
            {pending ? labels.publishing : labels.publish}
          </Button>
        </div>
      </div>
      <PublishStateBanner publish={data.publish} labels={labels} />
      <PublishResultBanner result={publishResult} labels={labels} />
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

function PublishStateBanner({
  publish,
  labels,
}: {
  publish: PublishState;
  labels: Labels;
}) {
  if (publish.available) return null;
  const message =
    publish.reason === "no_token"
      ? labels.publishUnavailableNoToken
      : publish.reason === "remote_missing"
        ? labels.publishUnavailableRemoteMissing
        : publish.reason === "github_error"
          ? labels.publishUnavailableGithubError
          : null;
  if (!message) return null;
  return (
    <div className="rounded-md border border-muted-foreground/30 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function PublishResultBanner({
  result,
  labels,
}: {
  result: PublishActionResult | null;
  labels: Labels;
}) {
  if (!result) return null;
  if (result.ok) {
    return (
      <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-xs text-success">
        <div className="font-semibold">{labels.publishSuccess}</div>
        <div className="mt-1">
          <a
            href={result.commitUrl}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2 hover:opacity-80"
          >
            {labels.viewCommit}{" "}
            <span className="font-mono">
              ({result.commitSha.slice(0, 7)})
            </span>
          </a>
        </div>
      </div>
    );
  }
  if (result.reason === "no_draft") {
    return (
      <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
        {labels.noDraftToPublish}
      </div>
    );
  }
  if (result.reason === "conflict") {
    return (
      <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
        <div className="font-semibold">{labels.conflictHeading}</div>
        <div className="mt-1">{labels.conflictBody}</div>
      </div>
    );
  }
  if (result.reason === "mdx_invalid") {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        <div className="font-semibold">{labels.mdxInvalidHeading}</div>
        <div className="mt-1 whitespace-pre-wrap font-mono">{result.message}</div>
      </div>
    );
  }
  if (result.reason === "github_error") {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        <div className="font-semibold">
          {labels.githubErrorHeading}
          {result.status ? ` (${result.status})` : ""}
        </div>
        <div className="mt-1 whitespace-pre-wrap font-mono">{result.message}</div>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
      <div className="font-semibold">{labels.configErrorHeading}</div>
      <div className="mt-1 font-mono">{result.message}</div>
    </div>
  );
}
