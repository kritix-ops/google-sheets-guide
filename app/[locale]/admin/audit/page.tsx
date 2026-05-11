import { desc, eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

import { AuditFilter } from "@/components/admin/audit-filter";
import { AuditTable } from "@/components/admin/audit-table";
import { requireRole } from "@/lib/auth/require-role";
import { db, schema } from "@/lib/db";
import type { AdminAction } from "@/lib/db/schema";

const PAGE_SIZE = 50;

const ACTION_VALUES: AdminAction[] = [
  "user.add",
  "user.remove",
  "user.role_change",
  "content.publish",
  "bootstrap.initial_admin",
];

function parseAction(raw: string | undefined): AdminAction | null {
  if (!raw) return null;
  return ACTION_VALUES.includes(raw as AdminAction)
    ? (raw as AdminAction)
    : null;
}

function parsePage(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

type Props = {
  searchParams: Promise<{ action?: string; page?: string }>;
};

export default async function AuditLogPage({ searchParams }: Props) {
  await requireRole("admin");
  const t = await getTranslations("admin");
  const { action: actionRaw, page: pageRaw } = await searchParams;
  const action = parseAction(actionRaw);
  const page = parsePage(pageRaw);
  const offset = (page - 1) * PAGE_SIZE;

  const where = action ? eq(schema.adminAudit.action, action) : undefined;

  const rows = await db
    .select()
    .from(schema.adminAudit)
    .where(where)
    .orderBy(desc(schema.adminAudit.at))
    .limit(PAGE_SIZE + 1)
    .offset(offset);

  const hasNextPage = rows.length > PAGE_SIZE;
  const visibleRows = rows.slice(0, PAGE_SIZE);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("audit.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("audit.description")}
        </p>
      </header>

      <AuditFilter
        currentAction={action}
        actions={ACTION_VALUES}
        labels={{
          filterByAction: t("audit.filterByAction"),
          all: t("audit.allActions"),
          actionLabels: {
            "user.add": t("audit.actions.user.add"),
            "user.remove": t("audit.actions.user.remove"),
            "user.role_change": t("audit.actions.user.role_change"),
            "content.publish": t("audit.actions.content.publish"),
            "bootstrap.initial_admin": t(
              "audit.actions.bootstrap.initial_admin",
            ),
          },
        }}
      />

      <AuditTable
        rows={visibleRows}
        labels={{
          when: t("audit.when"),
          who: t("audit.who"),
          action: t("audit.action"),
          target: t("audit.target"),
          changes: t("audit.changes"),
          before: t("audit.before"),
          after: t("audit.after"),
          empty: t("audit.empty"),
          actionLabels: {
            "user.add": t("audit.actions.user.add"),
            "user.remove": t("audit.actions.user.remove"),
            "user.role_change": t("audit.actions.user.role_change"),
            "content.publish": t("audit.actions.content.publish"),
            "bootstrap.initial_admin": t(
              "audit.actions.bootstrap.initial_admin",
            ),
          },
        }}
      />

      <Pagination
        page={page}
        hasNext={hasNextPage}
        action={action}
        labels={{
          previous: t("audit.previousPage"),
          next: t("audit.nextPage"),
          pageN: t("audit.pageN", { n: page }),
        }}
      />
    </div>
  );
}

function Pagination({
  page,
  hasNext,
  action,
  labels,
}: {
  page: number;
  hasNext: boolean;
  action: AdminAction | null;
  labels: { previous: string; next: string; pageN: string };
}) {
  const hasPrev = page > 1;
  function buildHref(target: number): string {
    const sp = new URLSearchParams();
    if (action) sp.set("action", action);
    if (target > 1) sp.set("page", String(target));
    const qs = sp.toString();
    return qs ? `?${qs}` : ".";
  }
  return (
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <div>{labels.pageN}</div>
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <a
            href={buildHref(page - 1)}
            className="rounded-md border border-input px-2 py-1 hover:bg-accent hover:text-accent-foreground"
          >
            {labels.previous}
          </a>
        ) : null}
        {hasNext ? (
          <a
            href={buildHref(page + 1)}
            className="rounded-md border border-input px-2 py-1 hover:bg-accent hover:text-accent-foreground"
          >
            {labels.next}
          </a>
        ) : null}
      </div>
    </div>
  );
}
