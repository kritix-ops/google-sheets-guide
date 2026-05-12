import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { Heebo, Inter, JetBrains_Mono } from "next/font/google";
import { notFound } from "next/navigation";

import { ThemeSync } from "@/components/theme-sync";
import { isRtl, type Locale, routing } from "@/lib/i18n/routing";
import {
  defaultThemeFor,
  LEGACY_THEME_STORAGE_KEY,
  THEME_DEFAULTS,
  THEME_STORAGE_PREFIX,
} from "@/lib/i18n/theme-defaults";
import "../globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sheets Guide",
  description: "Learn Google Sheets from novice to expert.",
};

// Inlined into <head> so it runs before paint. The server already knows the
// locale, so we hand the script the locale-specific storage key, the legacy
// (pre-per-locale) key for migration, and the locale's default. The script
// stays small on purpose; anything richer goes in <ThemeSync> below.
function buildThemeInitScript(locale: Locale): string {
  const storageKey = `${THEME_STORAGE_PREFIX}${locale}`;
  const fallback = defaultThemeFor(locale);
  return `
(function() {
  try {
    var stored = localStorage.getItem(${JSON.stringify(storageKey)});
    if (stored !== "light" && stored !== "dark") {
      stored = localStorage.getItem(${JSON.stringify(LEGACY_THEME_STORAGE_KEY)});
    }
    var theme = stored === "light" || stored === "dark"
      ? stored
      : ${JSON.stringify(fallback)};
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  } catch (e) {
    document.documentElement.classList.${fallback === "dark" ? "add" : "remove"}("dark");
  }
})();
`.trim();
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const messages = await getMessages();
  const dir = isRtl(locale as Locale) ? "rtl" : "ltr";

  const themeInitScript = buildThemeInitScript(locale as Locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${inter.variable} ${heebo.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {/* Keeps the active theme in sync when the locale changes via
              client-side navigation (the init script above only runs on
              full document load). */}
          <ThemeSync themeDefaults={THEME_DEFAULTS} />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
