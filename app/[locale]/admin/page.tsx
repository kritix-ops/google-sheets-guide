import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { requireRole } from "@/lib/auth/require-role";

export default async function AdminHomePage() {
  const user = await requireRole("editor");
  const locale = await getLocale();
  // Admins manage users, editors live in content. Skipping the landing
  // page until there's something dashboard-worthy to put on it.
  if (user.role === "admin") {
    redirect(`/${locale}/admin/users`);
  }
  redirect(`/${locale}/admin/content`);
}
