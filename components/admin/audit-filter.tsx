"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { AdminAction } from "@/lib/db/schema";

type Props = {
  currentAction: AdminAction | null;
  actions: AdminAction[];
  labels: {
    filterByAction: string;
    all: string;
    actionLabels: Record<AdminAction, string>;
  };
};

export function AuditFilter({ currentAction, actions, labels }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Changing the filter resets pagination to page 1, otherwise the user
  // lands on an empty page when they switch to a narrower filter.
  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    const sp = new URLSearchParams(searchParams.toString());
    if (next === "") {
      sp.delete("action");
    } else {
      sp.set("action", next);
    }
    sp.delete("page");
    const qs = sp.toString();
    router.push(qs ? `?${qs}` : ".");
  }

  return (
    <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
      <span>{labels.filterByAction}</span>
      <select
        value={currentAction ?? ""}
        onChange={handleChange}
        className="h-7 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <option value="">{labels.all}</option>
        {actions.map((action) => (
          <option key={action} value={action}>
            {labels.actionLabels[action]}
          </option>
        ))}
      </select>
    </label>
  );
}
