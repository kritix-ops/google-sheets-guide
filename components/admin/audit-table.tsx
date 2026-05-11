import type { AdminAction } from "@/lib/db/schema";

type AuditRow = {
  id: number;
  actorId: string | null;
  actorEmail: string;
  action: AdminAction;
  target: string;
  beforeJson: unknown;
  afterJson: unknown;
  at: Date;
};

type Props = {
  rows: AuditRow[];
  labels: {
    when: string;
    who: string;
    action: string;
    target: string;
    changes: string;
    before: string;
    after: string;
    empty: string;
    actionLabels: Record<AdminAction, string>;
  };
};

const tsFmt = new Intl.DateTimeFormat("en-CA", {
  dateStyle: "short",
  timeStyle: "short",
});

export function AuditTable({ rows, labels }: Props) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
        {labels.empty}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-start font-medium">
              {labels.when}
            </th>
            <th className="px-4 py-2 text-start font-medium">{labels.who}</th>
            <th className="px-4 py-2 text-start font-medium">
              {labels.action}
            </th>
            <th className="px-4 py-2 text-start font-medium">
              {labels.target}
            </th>
            <th className="px-4 py-2 text-start font-medium">
              {labels.changes}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t align-top">
              <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                {tsFmt.format(r.at)}
              </td>
              <td className="px-4 py-2 font-mono text-xs">{r.actorEmail}</td>
              <td className="px-4 py-2 text-xs">
                <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono">
                  {labels.actionLabels[r.action]}
                </span>
              </td>
              <td className="px-4 py-2 font-mono text-xs">
                <span className="break-all">{r.target}</span>
              </td>
              <td className="px-4 py-2">
                <Changes
                  before={r.beforeJson}
                  after={r.afterJson}
                  labels={labels}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Changes({
  before,
  after,
  labels,
}: {
  before: unknown;
  after: unknown;
  labels: { before: string; after: string };
}) {
  const commitUrl = extractCommitUrl(after);
  return (
    <div className="space-y-1 text-xs">
      {before !== null && before !== undefined ? (
        <div>
          <span className="text-muted-foreground">{labels.before}:</span>{" "}
          <code className="break-all font-mono">{stringify(before)}</code>
        </div>
      ) : null}
      {after !== null && after !== undefined ? (
        <div>
          <span className="text-muted-foreground">{labels.after}:</span>{" "}
          <code className="break-all font-mono">{stringify(after)}</code>
        </div>
      ) : null}
      {commitUrl ? (
        <a
          href={commitUrl}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-primary underline-offset-2 hover:underline"
        >
          {commitUrl}
        </a>
      ) : null}
    </div>
  );
}

function stringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function extractCommitUrl(after: unknown): string | null {
  if (after && typeof after === "object" && "commitUrl" in after) {
    const v = (after as { commitUrl?: unknown }).commitUrl;
    if (typeof v === "string" && v.startsWith("https://github.com/")) {
      return v;
    }
  }
  return null;
}
