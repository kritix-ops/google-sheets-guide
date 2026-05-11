import { NextResponse } from "next/server";

import { getAuthedUser } from "@/lib/auth/require-role";
import { runAdminSearch } from "@/lib/search/admin-query";

export async function POST(request: Request): Promise<NextResponse> {
  const actor = await getAuthedUser();
  if (!actor) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }
  // The lowest role in the system can search lessons (handled
  // client-side) but admin search exposes draft/audit/user data. Gate
  // at editor; the per-query helper further narrows by role.
  if (actor.role === "viewer") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const q =
    body && typeof body === "object" && "q" in body
      ? String((body as { q: unknown }).q ?? "")
      : "";
  if (!q || q.length > 200) {
    return NextResponse.json({ users: [], drafts: [], audit: [] });
  }

  const result = await runAdminSearch({ query: q, actor });
  return NextResponse.json(result);
}
