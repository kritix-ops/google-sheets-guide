import { getTranslations } from "next-intl/server";

import { addUser } from "@/app/[locale]/admin/users/actions";
import { Button } from "@/components/ui/button";

export async function AddUserForm() {
  const t = await getTranslations("admin");
  return (
    <form
      action={addUser}
      className="flex flex-wrap items-end gap-3 rounded-md border bg-card p-4"
    >
      <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs">
        <span className="text-muted-foreground">{t("users.email")}</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="off"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">{t("users.role")}</span>
        <select
          name="role"
          required
          defaultValue="editor"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <option value="admin">{t("users.roles.admin")}</option>
          <option value="editor">{t("users.roles.editor")}</option>
          <option value="viewer">{t("users.roles.viewer")}</option>
        </select>
      </label>
      <label className="flex min-w-[200px] flex-1 flex-col gap-1 text-xs">
        <span className="text-muted-foreground">{t("users.note")}</span>
        <input
          type="text"
          name="note"
          maxLength={200}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
      </label>
      <Button type="submit">{t("users.add")}</Button>
    </form>
  );
}
