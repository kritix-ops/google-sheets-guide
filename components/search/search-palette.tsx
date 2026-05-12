"use client";

import { Dialog } from "@base-ui/react/dialog";
import {
  BookOpen,
  ChevronRight,
  CornerDownLeft,
  FileEdit,
  Hash,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { LessonStatus, ProgressMap } from "@/lib/progress-utils";
import type {
  AdminAuditResult,
  AdminDraftResult,
  AdminUserResult,
  QuickAction,
} from "@/lib/search/types";
import { cn } from "@/lib/utils";

import { ResultRow } from "./result-row";
import { useRecentSearches } from "./use-recent-searches";
import { useSearch, type LessonHit } from "./use-search";

type Props = {
  locale: "en" | "he";
  progress: ProgressMap;
  quickActions: QuickAction[];
  // True when the signed-in user can hit the admin search endpoint
  // (i.e. role >= editor). Viewers only see lesson + action results.
  adminEnabled: boolean;
  // Label for the trigger button (already localized server-side).
  triggerLabel: string;
};

// A "selectable row" is anything in the result list the user can ↩
// to activate. We compute a flat list of these in display order so the
// keyboard navigation is one-dimensional regardless of group.
type SelectableRow =
  | { kind: "action"; action: QuickAction; href: string }
  | { kind: "recent"; query: string }
  | { kind: "lesson"; hit: LessonHit }
  | { kind: "heading"; hit: LessonHit }
  | { kind: "draft"; row: AdminDraftResult }
  | { kind: "user"; row: AdminUserResult }
  | { kind: "audit"; row: AdminAuditResult };

const ICONS = {
  lesson: BookOpen,
  heading: Hash,
  draft: FileEdit,
  user: Users,
  audit: ShieldCheck,
  action: Sparkles,
  recent: Search,
  settings: Settings,
} as const;

export function SearchPalette({
  locale,
  progress,
  quickActions,
  adminEnabled,
  triggerLabel,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = useTranslations("search");
  const tActions = useTranslations("search.actions");
  const tBadges = useTranslations("search.badges");
  const currentLocale = useLocale();

  const { values: recent, push: pushRecent, clear: clearRecent } =
    useRecentSearches();

  const localizedActions = useMemo(
    () =>
      quickActions.map((a) => ({
        ...a,
        label: tActions(a.label),
        hint: tActions(a.hint),
      })),
    [quickActions, tActions],
  );

  const {
    indexState,
    indexError,
    lessonHits,
    actionHits,
    adminResults,
    adminError,
  } = useSearch({
    locale,
    enabled: open,
    query,
    quickActions: localizedActions,
    adminEnabled,
  });

  const lessonResults = useMemo(() => lessonHits(), [lessonHits]);
  const actionResults = useMemo(() => actionHits(), [actionHits]);

  const lessons = useMemo(
    () => lessonResults.filter((r) => r.kind === "lesson"),
    [lessonResults],
  );
  const headings = useMemo(
    () => lessonResults.filter((r) => r.kind === "heading"),
    [lessonResults],
  );

  const trimmedQ = query.trim();

  // Build the flat row list in display order. The order is:
  //   Quick actions → Lessons → Headings → Drafts → Users → Audit
  // Empty query state replaces actions/lessons with Recent searches.
  const rows = useMemo<SelectableRow[]>(() => {
    const out: SelectableRow[] = [];
    if (!trimmedQ) {
      for (const q of recent) out.push({ kind: "recent", query: q });
      for (const action of localizedActions)
        out.push({
          kind: "action",
          action,
          href: `/${currentLocale}${action.href}`,
        });
      return out;
    }
    for (const action of actionResults)
      out.push({
        kind: "action",
        action: {
          ...action,
          // The label/hint were localized when we passed quickActions
          // into useSearch.
          label: action.label,
          hint: action.hint,
        },
        href: `/${currentLocale}${action.href}`,
      });
    for (const hit of lessons) out.push({ kind: "lesson", hit });
    for (const hit of headings) out.push({ kind: "heading", hit });
    for (const row of adminResults.drafts) out.push({ kind: "draft", row });
    for (const row of adminResults.users) out.push({ kind: "user", row });
    for (const row of adminResults.audit) out.push({ kind: "audit", row });
    return out;
  }, [
    trimmedQ,
    recent,
    localizedActions,
    actionResults,
    lessons,
    headings,
    adminResults,
    currentLocale,
  ]);

  // Reset selection when the row set changes. We compare previous and
  // current composite-key values during render rather than running an
  // effect, which keeps highlight in sync without a cascading rerender.
  const selectionKey = `${rows.length}|${trimmedQ}`;
  const [prevSelectionKey, setPrevSelectionKey] = useState(selectionKey);
  if (selectionKey !== prevSelectionKey) {
    setPrevSelectionKey(selectionKey);
    setActiveIndex(0);
  }

  // Keep the active row scrolled into view as the user arrows down.
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-row="${activeIndex}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Global ⌘K / Ctrl+K listener. Mounted once because we only render
  // one palette per app shell.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isModK =
        (e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey);
      if (!isModK) return;
      e.preventDefault();
      setOpen((prev) => !prev);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Reset the query when the palette closes so re-opening lands on a
  // clean empty state. The recent-searches list preserves history; the
  // input itself shouldn't. Detected with a prev-vs-current compare
  // during render to avoid the effect-driven setState pattern.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) setQuery("");
  }

  function activate(row: SelectableRow): void {
    if (row.kind === "recent") {
      setQuery(row.query);
      requestAnimationFrame(() => inputRef.current?.focus());
      return;
    }
    if (row.kind === "action") {
      pushRecentIfQuery();
      setOpen(false);
      router.push(row.href);
      return;
    }
    if (row.kind === "lesson" || row.kind === "heading") {
      pushRecentIfQuery();
      setOpen(false);
      router.push(`/${currentLocale}${row.hit.href}`);
      return;
    }
    if (row.kind === "draft") {
      pushRecentIfQuery();
      setOpen(false);
      router.push(`/${currentLocale}${row.row.href}`);
      return;
    }
    if (row.kind === "user") {
      pushRecentIfQuery();
      setOpen(false);
      router.push(`/${currentLocale}${row.row.href}`);
      return;
    }
    if (row.kind === "audit") {
      pushRecentIfQuery();
      setOpen(false);
      router.push(`/${currentLocale}${row.row.href}`);
      return;
    }
  }

  function pushRecentIfQuery(): void {
    if (trimmedQ.length >= 2) pushRecent(trimmedQ);
  }

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (rows.length === 0 ? 0 : (i + 1) % rows.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) =>
          rows.length === 0 ? 0 : (i - 1 + rows.length) % rows.length,
        );
      } else if (e.key === "Enter") {
        const row = rows[activeIndex];
        if (row) {
          e.preventDefault();
          activate(row);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, activeIndex],
  );

  const showRecent = !trimmedQ && recent.length > 0;
  const showInitialEmpty = !trimmedQ && recent.length === 0;
  const showNoResults =
    trimmedQ.length > 0 &&
    rows.length === 0 &&
    indexState !== "loading" &&
    indexState !== "idle";

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <button
            type="button"
            aria-label={triggerLabel}
            className="inline-flex h-8 items-center gap-3 rounded-md border bg-card px-3 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{triggerLabel}</span>
            <span className="hidden sm:inline rounded-sm border bg-background px-1 py-0.5 font-mono text-[10px] tracking-wide text-muted-foreground">
              ⌘K
            </span>
          </button>
        }
      />
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 transition-opacity" />
        <Dialog.Popup
          className={cn(
            "fixed left-1/2 top-[12vh] z-50 w-[min(640px,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border bg-popover text-popover-foreground shadow-2xl",
            "data-[starting-style]:opacity-0 data-[starting-style]:translate-y-2 data-[ending-style]:opacity-0",
            "transition-[opacity,transform] duration-150",
          )}
        >
          <Dialog.Title className="sr-only">{t("trigger")}</Dialog.Title>
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              ref={inputRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("placeholder")}
              dir="auto"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
            <kbd className="rounded-sm border bg-background px-1.5 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
              esc
            </kbd>
          </div>

          <div
            ref={listRef}
            className="max-h-[60vh] overflow-y-auto p-2"
          >
            {indexState === "loading" ? (
              <LoadingSkeleton />
            ) : null}

            {indexError ? (
              <BannerError message={t("errors.indexUnavailable")} detail={indexError} />
            ) : null}
            {adminError ? (
              <BannerError message={t("errors.adminSearchFailed")} detail={adminError} />
            ) : null}

            {showInitialEmpty ? (
              <EmptyState>{t("emptyInitial")}</EmptyState>
            ) : null}

            {showNoResults ? (
              <EmptyState>
                <span>{t("emptyNoResults", { query: trimmedQ })}</span>
                <span className="mt-1 block text-xs text-muted-foreground/80">
                  {t("emptyTip")}
                </span>
              </EmptyState>
            ) : null}

            {showRecent ? (
              <Section
                title={t("recent")}
                trailing={
                  <button
                    type="button"
                    onClick={clearRecent}
                    className="inline-flex items-center gap-1 rounded-sm px-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("clearRecent")}
                  </button>
                }
              >
                {rows
                  .map((r, i) => ({ row: r, i }))
                  .filter((x) => x.row.kind === "recent")
                  .map(({ row, i }) =>
                    row.kind === "recent" ? (
                      <ResultRow
                        key={i}
                        icon={ICONS.recent}
                        title={row.query}
                        query={query}
                        active={activeIndex === i}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => activate(row)}
                      />
                    ) : null,
                  )}
              </Section>
            ) : null}

            <GroupBlock
              rows={rows}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              activate={activate}
              kind="action"
              title={t("groups.actions")}
              icon={ICONS.action}
              query={query}
              render={(row) => {
                if (row.kind !== "action") return null;
                return {
                  title: row.action.label,
                  subtitle: row.action.hint,
                  badge: null,
                  breadcrumbs: null,
                };
              }}
            />

            <GroupBlock
              rows={rows}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              activate={activate}
              kind="lesson"
              title={t("groups.lessons")}
              icon={ICONS.lesson}
              query={query}
              render={(row) => {
                if (row.kind !== "lesson") return null;
                const status = progressFor(progress, row.hit);
                return {
                  title: row.hit.title,
                  subtitle: row.hit.body.slice(0, 160),
                  badge: progressBadge(status, tBadges),
                  breadcrumbs: [row.hit.trackLabel],
                };
              }}
            />

            <GroupBlock
              rows={rows}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              activate={activate}
              kind="heading"
              title={t("groups.headings")}
              icon={ICONS.heading}
              query={query}
              render={(row) => {
                if (row.kind !== "heading") return null;
                return {
                  title: row.hit.heading ?? row.hit.title,
                  subtitle: row.hit.body.slice(0, 160),
                  badge: null,
                  breadcrumbs: [row.hit.trackLabel, row.hit.title],
                };
              }}
            />

            <GroupBlock
              rows={rows}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              activate={activate}
              kind="draft"
              title={t("groups.drafts")}
              icon={ICONS.draft}
              query={query}
              render={(row) => {
                if (row.kind !== "draft") return null;
                return {
                  title: `${row.row.track}/${row.row.slug}`,
                  subtitle: row.row.snippet,
                  badge: {
                    label: row.row.lang.toUpperCase(),
                    tone: "muted" as const,
                  },
                  breadcrumbs: [row.row.authorEmail],
                };
              }}
            />

            <GroupBlock
              rows={rows}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              activate={activate}
              kind="user"
              title={t("groups.users")}
              icon={ICONS.user}
              query={query}
              render={(row) => {
                if (row.kind !== "user") return null;
                return {
                  title: row.row.email,
                  subtitle: row.row.note,
                  badge: { label: row.row.role, tone: "accent" as const },
                  breadcrumbs: null,
                };
              }}
            />

            <GroupBlock
              rows={rows}
              activeIndex={activeIndex}
              setActiveIndex={setActiveIndex}
              activate={activate}
              kind="audit"
              title={t("groups.audit")}
              icon={ICONS.audit}
              query={query}
              render={(row) => {
                if (row.kind !== "audit") return null;
                return {
                  title: row.row.action,
                  subtitle: row.row.target,
                  badge: { label: row.row.actorEmail, tone: "muted" as const },
                  breadcrumbs: null,
                };
              }}
            />
          </div>

          <FooterHints t={t} />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function GroupBlock({
  rows,
  activeIndex,
  setActiveIndex,
  activate,
  kind,
  title,
  icon,
  query,
  render,
}: {
  rows: SelectableRow[];
  activeIndex: number;
  setActiveIndex: (i: number) => void;
  activate: (row: SelectableRow) => void;
  kind: SelectableRow["kind"];
  title: string;
  icon: LucideIcon;
  query: string;
  render: (row: SelectableRow) =>
    | {
        title: string;
        subtitle: string | null;
        badge:
          | { label: string; tone: "success" | "warning" | "muted" | "accent" }
          | null;
        breadcrumbs: string[] | null;
      }
    | null;
}) {
  const inGroup = rows
    .map((r, i) => ({ row: r, i }))
    .filter((x) => x.row.kind === kind);
  if (inGroup.length === 0) return null;
  return (
    <Section title={title}>
      {inGroup.map(({ row, i }) => {
        const r = render(row);
        if (!r) return null;
        return (
          <div key={i} data-row={i}>
            <ResultRow
              icon={icon}
              title={r.title}
              subtitle={r.subtitle ?? undefined}
              breadcrumbs={r.breadcrumbs ?? undefined}
              badge={r.badge}
              query={query}
              active={activeIndex === i}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => activate(row)}
            />
          </div>
        );
      })}
    </Section>
  );
}

function Section({
  title,
  trailing,
  children,
}: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-1 space-y-0.5">
      <div className="flex items-center justify-between px-2 pb-1 pt-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/80">
          {title}
        </span>
        {trailing}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center text-sm text-muted-foreground">
      <Sparkles className="h-5 w-5 opacity-60" />
      <div>{children}</div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 px-2 py-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-md bg-muted/40"
        />
      ))}
    </div>
  );
}

function BannerError({ message, detail }: { message: string; detail: string }) {
  return (
    <div
      className="mx-2 mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
      title={detail}
    >
      {message}
    </div>
  );
}

function FooterHints({
  t,
}: {
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-4 py-2 text-[10px] text-muted-foreground">
      <span className="inline-flex items-center gap-1">
        <kbd className="rounded-sm border bg-background px-1 font-mono">↑↓</kbd>
        {t("hints.nav")}
      </span>
      <span className="inline-flex items-center gap-1">
        <CornerDownLeft className="h-3 w-3" />
        {t("hints.select")}
      </span>
      <span className="inline-flex items-center gap-1">
        <kbd className="rounded-sm border bg-background px-1 font-mono">esc</kbd>
        {t("hints.close")}
      </span>
      <span className="inline-flex items-center gap-1">
        <ChevronRight className="h-3 w-3" />
        <kbd className="rounded-sm border bg-background px-1 font-mono">⌘K</kbd>
      </span>
    </div>
  );
}

function progressFor(map: ProgressMap, hit: LessonHit): LessonStatus {
  return map[hit.assignmentId]?.status ?? "not-started";
}

function progressBadge(
  status: LessonStatus,
  t: ReturnType<typeof useTranslations>,
): { label: string; tone: "success" | "warning" | "muted" } {
  if (status === "passed")
    return { label: t("completed"), tone: "success" };
  if (status === "in-progress")
    return { label: t("inProgress"), tone: "warning" };
  return { label: t("notStarted"), tone: "muted" };
}
