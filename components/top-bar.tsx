import { getTranslations } from "next-intl/server";

import { AccountMenu } from "@/components/account-menu";
import { LocaleToggle } from "@/components/locale-toggle";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/auth";
import { Link } from "@/lib/i18n/navigation";

export async function TopBar() {
  const session = await auth();
  const user = session?.user;
  const t = await getTranslations("app");

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

      <div className="flex items-center gap-2">
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
