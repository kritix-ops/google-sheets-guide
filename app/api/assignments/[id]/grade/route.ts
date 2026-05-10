import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getAssignment } from "@/lib/content/registry";
import { db, schema } from "@/lib/db";
import { getGoogleClientsForUser } from "@/lib/google/client";
import { GoogleSheetsReader } from "@/lib/google/sheetsReader";
import { gradeAttempt } from "@/lib/grading";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const assignment = getAssignment(id);
  if (!assignment) {
    return NextResponse.json(
      { error: `assignment ${id} not found` },
      { status: 404 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    attemptId?: number;
  } | null;
  if (!body?.attemptId) {
    return NextResponse.json(
      { error: "attemptId is required in the request body" },
      { status: 400 },
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
  if (attempt.userId !== userId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (attempt.assignmentSlug !== assignment.id) {
    return NextResponse.json(
      { error: "attempt does not match this assignment" },
      { status: 400 },
    );
  }

  const clients = await getGoogleClientsForUser(userId);
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
