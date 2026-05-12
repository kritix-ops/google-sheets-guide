import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { signAttemptToken } from "@/lib/auth/sidebar-token";
import { getAssignment } from "@/lib/content/registry";
import { db, schema } from "@/lib/db";
import { getGoogleClientsForUser } from "@/lib/google/client";
import { provisionAssignmentSheet } from "@/lib/google/drive";
import { provisionLessonSidebar } from "@/lib/google/script";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n/routing";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id: userId, email } = session.user;

  const { id } = await ctx.params;
  const assignment = getAssignment(id);
  if (!assignment) {
    return NextResponse.json(
      { error: `assignment ${id} not found` },
      { status: 404 },
    );
  }

  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const rawLocale = url.searchParams.get("locale");
  const locale: string = (LOCALES as readonly string[]).includes(rawLocale ?? "")
    ? (rawLocale as string)
    : DEFAULT_LOCALE;

  const clients = await getGoogleClientsForUser(userId);
  const provisioned = await provisionAssignmentSheet({
    drive: clients.drive,
    sheets: clients.sheets,
    assignment,
    userLabel: email ?? undefined,
  });

  const [attempt] = await db
    .insert(schema.attempts)
    .values({
      userId,
      assignmentSlug: assignment.id,
      sheetId: provisioned.sheetId,
    })
    .returning();

  // Mint the HMAC-signed token that authorizes grade calls from the
  // sidebar iframe. The token carries the attemptId; the grade endpoint
  // validates it without needing a session cookie (which the cross-site
  // iframe can't carry).
  const attemptToken = signAttemptToken(attempt.id);

  // Provision the in-sheet sidebar. If this fails, the sheet is still
  // usable via the web-app fallback (Open your sheet / Grade my work).
  let sidebarScriptId: string | null = null;
  let sidebarError: string | null = null;
  try {
    const sidebar = await provisionLessonSidebar({
      script: clients.script,
      sheetId: provisioned.sheetId,
      attemptId: attempt.id,
      attemptToken,
      lessonAssignmentId: assignment.id,
      locale,
      baseUrl,
      seedScript: assignment.seedScript,
    });
    sidebarScriptId = sidebar.scriptId;
    // Persist the bound script ID so Track 3 graders can fetch its source.
    // Same project hosts both the sidebar shell and the learner's edits.
    await db
      .update(schema.attempts)
      .set({ scriptId: sidebar.scriptId })
      .where(eq(schema.attempts.id, attempt.id));
  } catch (err) {
    sidebarError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    attemptId: attempt.id,
    sheetId: provisioned.sheetId,
    sheetUrl: provisioned.sheetUrl,
    sidebarScriptId,
    sidebarError,
  });
}
