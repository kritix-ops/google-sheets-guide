"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/lib/i18n/navigation";
import { LOCALES, type Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

export function LocaleToggle() {
  const t = useTranslations("locale");
  const current = useLocale() as Locale;
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label={t("switchTo", { language: t(otherLocale(current) === "he" ? "hebrew" : "english") })}
      className="inline-flex h-8 items-center rounded-md border bg-background p-0.5 text-xs font-medium"
    >
      {LOCALES.map((locale) => {
        const active = locale === current;
        const label = locale === "he" ? t("labelHe") : t("labelEn");
        return (
          <Link
            key={locale}
            href={pathname}
            locale={locale}
            scroll={false}
            replace
            className={cn(
              "inline-flex h-7 min-w-8 items-center justify-center rounded-sm px-2 transition-colors",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring",
              active
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={active ? "true" : undefined}
            aria-label={t("switchTo", {
              language: locale === "he" ? t("hebrew") : t("english"),
            })}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

function otherLocale(current: Locale): Locale {
  return current === "en" ? "he" : "en";
}
