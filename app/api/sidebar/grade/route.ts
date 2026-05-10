import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getAssignment } from "@/lib/content/registry";
import { db, schema } from "@/lib/db";
import { getGoogleClientsForUser } from "@/lib/google/client";
import { GoogleSheetsReader } from "@/lib/google/sheetsReader";
import { gradeAttempt } from "@/lib/grading";

// Sidebar-flavored grade endpoint. Public (allowlisted in proxy.ts) because
// the Apps Script sandbox iframe is on `googleusercontent.com` and our
// SameSite=lax session cookie does not flow into it.
//
// Trust model: localhost-only, single-user. Authorization is via attemptId →
// the attempt row carries the userId, and we load that user's Google
// credentials from the DB. If we ever leave localhost, swap this for a
// signed token passed in the iframe URL at provisioning time. See
// _plans/2026-05-10-option-b-sidebar.md open-question 1.

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as {
    assignmentId?: string;
    attemptId?: number;
  } | null;
  if (!body?.assignmentId || !body.attemptId) {
    return NextResponse.json(
      { error: "assignmentId and attemptId are required" },
      { status: 400 },
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
