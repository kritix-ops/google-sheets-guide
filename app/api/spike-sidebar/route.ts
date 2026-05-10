import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getGoogleClientsForUser } from "@/lib/google/client";
import { runSidebarSpike } from "@/lib/google/spike";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const locale = url.searchParams.get("locale") ?? "en";

  const clients = await getGoogleClientsForUser(session.user.id);
  const result = await runSidebarSpike({
    sheets: clients.sheets,
    script: clients.script,
    baseUrl,
    locale,
  });

  return NextResponse.json(result);
}
