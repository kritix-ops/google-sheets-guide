import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { verifyAttemptToken } from "@/lib/auth/sidebar-token";
import { getAssignment } from "@/lib/content/registry";
import { db, schema } from "@/lib/db";
import { getGoogleClientsForUser } from "@/lib/google/client";
import { GoogleSheetsReader } from "@/lib/google/sheetsReader";
import { gradeAttempt } from "@/lib/grading";

// Sidebar-flavored grade endpoint. Public (allowlisted in proxy.ts) because
// the Apps Script sandbox iframe is on `googleusercontent.com` and our
// SameSite=lax session cookie does not flow into it.
//
// Authorization: HMAC-signed attempt token minted at provision time. The
// token carries the attemptId; we verify the signature and expiry before
// touching the DB. Without a valid token, the caller can't enumerate
// integer attemptIds to trigger paid Sheets + Anthropic API calls on a
// victim's behalf.

// Minimum seconds between two grade requests for the same attempt. The
// judge call is paid (Anthropic API) and the sheet read is paid (Google
// quota); a tighter floor protects both. Sourced from the latest grade
// row's timestamp so the check survives process restarts.
const GRADE_COOLDOWN_MS = 3_000;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    assignmentId?: string;
    attemptId?: number;
    attemptToken?: string;
  } | null;
  if (!body?.assignmentId || !body.attemptId || !body.attemptToken) {
    return NextResponse.json(
      { error: "assignmentId, attemptId, and attemptToken are required" },
      { status: 400 },
    );
  }

  const verified = verifyAttemptToken(body.attemptToken);
  if (!verified.ok) {
    return NextResponse.json(
      { error: `attempt token ${verified.reason}` },
      { status: 401 },
    );
  }
  if (verified.attemptId !== body.attemptId) {
    return NextResponse.json(
      { error: "attempt token does not match attemptId" },
      { status: 401 },
    );
  }

  const assignment = getAssignment(body.assignmentId);
  if (!assignment) {
    return NextResponse.json(
      { error: `assignment ${body.assignmentId} not found` },
      { status: 404 },
    );
  }

  const [attempt] = await db
    .select()
    .from(schema.attempts)
    .where(eq(schema.attempts.id, body.attemptId));
  if (!attempt) {
    return NextResponse.json(
      { error: `attempt ${body.attemptId} not found` },
      { status: 404 },
    );
  }
  if (attempt.assignmentSlug !== assignment.id) {
    return NextResponse.json(
      { error: "attempt does not match this assignment" },
      { status: 400 },
    );
  }

  // Cooldown: refuse if a grade landed for this attempt in the last
  // GRADE_COOLDOWN_MS. Cheap query and survives restarts.
  const [latest] = await db
    .select({ gradedAt: schema.grades.gradedAt })
    .from(schema.grades)
    .where(eq(schema.grades.attemptId, attempt.id))
    .orderBy(desc(schema.grades.gradedAt))
    .limit(1);
  if (latest && Date.now() - latest.gradedAt.getTime() < GRADE_COOLDOWN_MS) {
    const retryMs =
      GRADE_COOLDOWN_MS - (Date.now() - latest.gradedAt.getTime());
    return NextResponse.json(
      { error: "rate limited; please wait a moment and try again" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(retryMs / 1000)) },
      },
    );
  }

  const clients = await getGoogleClientsForUser(attempt.userId);
  const reader = new GoogleSheetsReader(
    clients.sheets,
    attempt.sheetId,
    clients.drive,
    clients.script,
    attempt.scriptId,
  );
  const result = await gradeAttempt(assignment, reader);

  await db.insert(schema.grades).values({
    attemptId: attempt.id,
    score: result.score,
    passed: result.passed,
    gradedBy: result.gradedBy,
    feedback: result.feedback,
  });

  return NextResponse.json(result);
}
