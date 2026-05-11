import { getTranslations } from "next-intl/server";

import { auth } from "@/auth";
import { AccountMenu } from "@/components/account-menu";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { getAuthedUser, roleAtLeast } from "@/lib/auth/require-role";
import { Link } from "@/lib/i18n/navigation";

export async function TopBar() {
  const session = await auth();
  const user = session?.user;
  const authed = await getAuthedUser();
  const t = await getTranslations("app");
  const tAdmin = await getTranslations("admin");

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
