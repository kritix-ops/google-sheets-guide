import { getTranslations } from "next-intl/server";

import {
  changeUserRole,
  removeUser,
} from "@/app/[locale]/admin/users/actions";
import { Button } from "@/components/ui/button";
import type { AppRole } from "@/lib/db/schema";

type UserRow = {
  email: string;
  role: AppRole;
  addedAt: Date;
  note: string | null;
};

export async function UserList({
  users,
  currentUserEmail,
}: {
  users: UserRow[];
  currentUserEmail: string;
}) {
  const t = await getTranslations("admin");
  // en-CA renders ISO-ish (2026-05-11) regardless of locale; we want a
  // language-neutral date column.
  const dateFmt = new Intl.DateTimeFormat("en-CA", { dateStyle: "short" });

  if (users.length === 0) {
    return (
      <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
        {t("users.empty")}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-2 text-start font-medium">
              {t("users.email")}
            </th>
            <th className="px-4 py-2 text-start font-medium">
              {t("users.role")}
            </th>
            <th className="px-4 py-2 text-start font-medium">
              {t("users.addedAt")}
            </th>
            <th className="px-4 py-2 text-start font-medium">
              {t("users.note")}
            </th>
            <th className="px-4 py-2 text-end font-medium">
              {t("users.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const isSelf = u.email === currentUserEmail;
            return (
              <tr key={u.email} className="border-t">
                <td className="px-4 py-2 font-mono text-xs">
                  {u.email}
                  {isSelf ? (
                    <span className="ms-2 text-muted-foreground">
                      {t("users.you")}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2">
                  <form
                    action={changeUserRole}
                    className="inline-flex items-center gap-2"
                  >
                    <input type="hidden" name="email" value={u.email} />
                    <select
                      name="role"
                      defaultValue={u.role}
                      className="h-7 rounded-md border border-input bg-background px-2 text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <option value="admin">{t("users.roles.admin")}</option>
                      <option value="editor">{t("users.roles.editor")}</option>
                      <option value="viewer">{t("users.roles.viewer")}</option>
                    </select>
                    <Button
                      type="submit"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                    >
                      {t("users.save")}
                    </Button>
                  </form>
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {dateFmt.format(u.addedAt)}
                </td>
                <td className="px-4 py-2 text-xs text-muted-foreground">
                  {u.note ?? ""}
                </td>
                <td className="px-4 py-2 text-end">
                  {!isSelf ? (
                    <form action={removeUser} className="inline">
                      <input type="hidden" name="email" value={u.email} />
                      <Button
                        type="submit"
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                      >
                        {t("users.remove")}
                      </Button>
                    </form>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
