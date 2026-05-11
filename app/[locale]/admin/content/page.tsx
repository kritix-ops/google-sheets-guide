import { getTranslations } from "next-intl/server";

import { requireRole } from "@/lib/auth/require-role";

export default async function ContentAdminPage() {
  await requireRole("editor");
  const t = await getTranslations("admin");
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("content.title")}
        </h1>
      </header>
      <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">
        {t("content.comingSoon")}
      </div>
    </div>
  );
}
