import { getTranslations } from "next-intl/server";

import { roleAtLeast } from "@/lib/auth/require-role";
import type { AppRole } from "@/lib/db/schema";
import { Link } from "@/lib/i18n/navigation";

export async function AdminNav({ role }: { role: AppRole }) {
  const t = await getTranslations("admin");
  return (
    <nav className="border-b bg-muted/30">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-2 text-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("title")}
        </span>
        {roleAtLeast(role, "admin") && (
          <Link
            href="/admin/users"
            className="text-foreground/80 hover:text-foreground hover:underline"
          >
            {t("nav.users")}
          </Link>
        )}
        <Link
          href="/admin/content"
          className="text-foreground/80 hover:text-foreground hover:underline"
        >
          {t("nav.content")}
        </Link>
      </div>
    </nav>
  );
}
