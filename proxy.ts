import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { DEFAULT_LOCALE, LOCALES, routing } from "@/lib/i18n/routing";

// Auth.js v5 stores the session token in an http-only cookie. With the database
// session strategy the actual validation requires the DB adapter (Node-only),
// which can't run in Edge middleware. We do a cheap presence-check here and
// rely on auth() inside server components / route handlers for real validation.

const intlMiddleware = createIntlMiddleware(routing);

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

const LOCALE_PATTERN = `(${LOCALES.join("|")})`;
const PUBLIC_LOCALE_PATTERNS: RegExp[] = [
  new RegExp(`^/${LOCALE_PATTERN}/sign-in(/.*)?$`),
  // In-sheet sidebar surface and Phase-1 spike target — both loaded inside
  // the Apps Script sandbox iframe which can't carry our session cookie.
  // See _plans/2026-05-10-option-b-sidebar.md.
  new RegExp(`^/${LOCALE_PATTERN}/sidebar(/.*)?$`),
  new RegExp(`^/${LOCALE_PATTERN}/test-sidebar(/.*)?$`),
];
const PUBLIC_API_PATTERNS: RegExp[] = [
  /^\/api\/auth(\/.*)?$/,
  /^\/api\/sidebar(\/.*)?$/,
  /^\/api\/test-ping(\/.*)?$/,
];

function hasSessionCookie(req: NextRequest): boolean {
  return SESSION_COOKIE_NAMES.some((name) => req.cookies.has(name));
}

function localeFromPath(pathname: string): string {
  const match = pathname.match(new RegExp(`^/${LOCALE_PATTERN}(?:/|$)`));
  return match?.[1] ?? DEFAULT_LOCALE;
}

function preferredLocale(req: NextRequest): string {
  const cookieConfig = routing.localeCookie;
  const cookieName =
    typeof cookieConfig === "object" && cookieConfig
      ? (cookieConfig.name ?? "NEXT_LOCALE")
      : "NEXT_LOCALE";
  const cookie = req.cookies.get(cookieName);
  if (cookie && (LOCALES as readonly string[]).includes(cookie.value)) {
    return cookie.value;
  }
  return DEFAULT_LOCALE;
}

export default function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // API routes don't carry a locale prefix; gate them with auth only.
  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API_PATTERNS.some((re) => re.test(pathname))) {
      return NextResponse.next();
    }
    if (hasSessionCookie(req)) return NextResponse.next();
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Run next-intl first so locale resolution / redirects happen before auth.
  // If the request lacks a locale prefix, intl will redirect; we honor that
  // unconditionally so the user lands on a locale-prefixed URL before any
  // auth gating runs.
  const intlResponse = intlMiddleware(req);
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  // Public pages within a locale (sign-in) bypass auth.
  if (PUBLIC_LOCALE_PATTERNS.some((re) => re.test(pathname))) {
    return intlResponse;
  }

  if (hasSessionCookie(req)) {
    return intlResponse;
  }

  const locale = localeFromPath(pathname) || preferredLocale(req);
  const signInUrl = new URL(`/${locale}/sign-in`, req.url);
  signInUrl.searchParams.set("callbackUrl", pathname + search);
  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
