import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getGoogleClientsForUser } from "@/lib/google/client";
import { runSidebarSpike } from "@/lib/google/spike";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/routing";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const rawLocale = url.searchParams.get("locale");
  const locale: string = (LOCALES as readonly string[]).includes(rawLocale ?? "")
    ? (rawLocale as string)
    : DEFAULT_LOCALE;

  const clients = await getGoogleClientsForUser(session.user.id);
  const result = await runSidebarSpike({
    sheets: clients.sheets,
    script: clients.script,
    baseUrl,
    locale,
  });

  return NextResponse.json(result);
}
