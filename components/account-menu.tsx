"use client";

import { LogOut, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/lib/i18n/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

export type AccountMenuProps = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function AccountMenu({ name, email, image }: AccountMenuProps) {
  const t = useTranslations("account");
  const tLocale = useTranslations("locale");
  const currentLocale = useLocale() as Locale;
  const router = useRouter();

  const initials =
    (name ?? email ?? "?")
      .split(/[\s@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("") || "?";

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    window.location.href = `/${currentLocale}/sign-in`;
  }

  function setDefaultLocale(locale: Locale) {
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    if (locale !== currentLocale) {
      router.replace("/", { locale });
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "rounded-full",
        )}
        aria-label={t("menuLabel")}
      >
        <Avatar className="size-7">
          {image ? <AvatarImage src={image} alt={name ?? t("signedIn")} /> : null}
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-start gap-2">
          <User className="mt-0.5 size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {name ?? t("signedIn")}
            </div>
            {email ? (
              <div className="truncate text-xs text-muted-foreground">
                {email}
              </div>
            ) : null}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <div className="px-2 py-2">
          <p className="text-xs font-medium text-foreground">
            {t("defaultLanguage")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("defaultLanguageHelp")}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1">
            {LOCALES.map((locale) => {
              const active = locale === currentLocale;
              return (
                <button
                  key={locale}
                  type="button"
                  onClick={() => setDefaultLocale(locale)}
                  className={cn(
                    "rounded-sm border px-2 py-1.5 text-xs transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
                    active
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-accent",
                  )}
                  aria-pressed={active}
                >
                  {locale === "he" ? tLocale("hebrew") : tLocale("english")}
                </button>
              );
            })}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="size-4" />
          {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
