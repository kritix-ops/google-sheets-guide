import { and, eq, gt } from "drizzle-orm";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { db, schema } from "@/lib/db";
import { DEFAULT_LOCALE, LOCALES, routing } from "@/lib/i18n/routing";

// In Next.js 16 the proxy file runs on the Node.js runtime, so we can do a
// real DB validation of the session token here instead of the older
// cookie-presence-only check. That closes a defense-in-depth gap: any route
// or server component that forgets to call `auth()` is still protected by
// this layer.

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

// Surfaces that bypass the session check. Each must do its own
// authorization (signed token, NextAuth handler, etc.). DO NOT widen this
// list without an explicit threat model — the session gate is the cheap
// default and removing it for a route makes that route directly
// internet-reachable.
const PUBLIC_API_PATTERNS: RegExp[] = [
  /^\/api\/auth(\/.*)?$/,
  // Grade endpoint validates an HMAC-signed attempt token (see
  // lib/auth/sidebar-token.ts) — the iframe carries it, victims do not.
  /^\/api\/sidebar\/grade$/,
];

function readSessionToken(req: NextRequest): string | null {
  for (const name of SESSION_COOKIE_NAMES) {
    const cookie = req.cookies.get(name);
    if (cookie?.value) return cookie.value;
  }
  return null;
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = readSessionToken(req);
  if (!token) return false;
  const rows = await db
    .select({ userId: schema.sessions.userId })
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.sessionToken, token),
        gt(schema.sessions.expires, new Date()),
      ),
    )
    .limit(1);
  return rows.length > 0;
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

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // API routes don't carry a locale prefix; gate them with auth only.
  if (pathname.startsWith("/api/")) {
    if (PUBLIC_API_PATTERNS.some((re) => re.test(pathname))) {
      return NextResponse.next();
    }
    if (await hasValidSession(req)) return NextResponse.next();
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

  // Public pages within a locale (sign-in, sidebar iframe surfaces) bypass auth.
  if (PUBLIC_LOCALE_PATTERNS.some((re) => re.test(pathname))) {
    return intlResponse;
  }

  if (await hasValidSession(req)) {
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
