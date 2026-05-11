import type { AppRole } from "@/lib/db/schema";
import { roleAtLeast } from "@/lib/auth/require-role";

import type { QuickAction } from "./types";

// Static registry of "do this now" actions surfaced above content
// results in the search palette. i18n is layered on at render time by
// looking up the `label` and `hint` keys under messages.search.actions.
// Order in the array decides the default display order before fuzzy
// matching reorders by relevance.
const ACTIONS: QuickAction[] = [
  {
    id: "go-curriculum",
    label: "openCurriculum.label",
    hint: "openCurriculum.hint",
    href: "/curriculum",
    minRole: "viewer",
  },
  {
    id: "edit-content",
    label: "editContent.label",
    hint: "editContent.hint",
    href: "/admin/content",
    minRole: "editor",
  },
  {
    id: "manage-users",
    label: "manageUsers.label",
    hint: "manageUsers.hint",
    href: "/admin/users",
    minRole: "admin",
  },
  {
    id: "open-audit",
    label: "openAudit.label",
    hint: "openAudit.hint",
    href: "/admin/audit",
    minRole: "admin",
  },
];

// Return only the actions the given role can execute. The palette UI
// receives this list at open time so it never gets a chance to show an
// action the user can't act on.
export function quickActionsForRole(role: AppRole): QuickAction[] {
  return ACTIONS.filter((a) => roleAtLeast(role, a.minRole));
}
