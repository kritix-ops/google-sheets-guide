import { getLocale, getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { AccountMenu } from "@/components/account-menu";
import { LocaleToggle } from "@/components/locale-toggle";
import { SearchPalette } from "@/components/search/search-palette";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAuthedUser, roleAtLeast } from "@/lib/auth/require-role";
import { Link } from "@/lib/i18n/navigation";
import { getProgressForCurrentUser } from "@/lib/progress";
import { quickActionsForRole } from "@/lib/search/quick-actions";

export async function TopBar() {
  const session = await auth();
  const user = session?.user;
  const authed = await getAuthedUser();
  const t = await getTranslations("app");
  const tAdmin = await getTranslations("admin");
  const tSearch = await getTranslations("search");
  const locale = (await getLocale()) as "en" | "he";

  // Progress is only meaningful for signed-in users; for anonymous
  // visitors the map is empty and search results just show "not
  // started" badges, which is the correct affordance.
  const progress = authed ? await getProgressForCurrentUser() : {};
  const role = authed?.role ?? "viewer";
  const actions = quickActionsForRole(role);
  const adminEnabled = roleAtLeast(role, "editor");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-semibold tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-sm"
      >
        <span className="grid size-6 place-items-center rounded-sm bg-primary font-mono text-[11px] font-bold text-primary-foreground">
          SG
        </span>
        <span>{t("name")}</span>
      </Link>

      <div className="flex items-center gap-3">
        <SearchPalette
          locale={locale}
          progress={progress}
          quickActions={actions}
          adminEnabled={adminEnabled}
          triggerLabel={tSearch("trigger")}
        />
        {authed && roleAtLeast(authed.role, "editor") ? (
          <Link
            href="/admin"
            className="rounded-sm px-2 py-1 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {tAdmin("title")}
          </Link>
        ) : null}
        <LocaleToggle />
        <ThemeToggle />
        {user ? (
          <AccountMenu
            name={user.name}
            email={user.email}
            image={user.image}
          />
        ) : null}
      </div>
    </header>
  );
}
