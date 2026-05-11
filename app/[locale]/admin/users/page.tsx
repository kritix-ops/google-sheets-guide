import { desc } from "drizzle-orm";
import { getTranslations } from "next-intl/server";

import { AddUserForm } from "@/components/admin/add-user-form";
import { UserList } from "@/components/admin/user-list";
import { requireRole } from "@/lib/auth/require-role";
import { db, schema } from "@/lib/db";

export default async function UsersAdminPage() {
  const me = await requireRole("admin");
  const t = await getTranslations("admin");
  const users = await db.query.allowedUsers.findMany({
    orderBy: [desc(schema.allowedUsers.addedAt)],
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("users.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("users.description")}
        </p>
      </header>
      <section className="space-y-3">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {t("users.addTitle")}
        </h2>
        <AddUserForm />
      </section>
      <section>
        <UserList users={users} currentUserEmail={me.email} />
      </section>
    </div>
  );
}
