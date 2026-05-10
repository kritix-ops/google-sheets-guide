import { NextResponse } from "next/server";

// Public ping endpoint used by the Phase-1 sidebar spike to verify that
// JS inside the Apps Script sandbox iframe can fetch a localhost API.
// Allowlisted in proxy.ts (no auth required).

export async function GET() {
  return NextResponse.json({
    ok: true,
    at: new Date().toISOString(),
    note: "Reached localhost from inside the Apps Script sidebar iframe.",
  });
}
