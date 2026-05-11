import "server-only";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { cache } from "react";

import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import type { AppRole } from "@/lib/db/schema";

const { allowedUsers } = schema;

const ROLE_RANK: Record<AppRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
};

export type AuthedUser = {
  userId: string;
  email: string;
  role: AppRole;
};

// Memoize the lookup within a single server render pass. The signIn
// callback already validated allowlist membership; this just hydrates the
// role for downstream auth checks.
export const getAuthedUser = cache(async (): Promise<AuthedUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  const email = session?.user?.email?.toLowerCase();
  if (!userId || !email) return null;

  const row = await db.query.allowedUsers.findFirst({
    where: eq(allowedUsers.email, email),
  });
  // Row may have been removed between sign-in and now (admin revoked
  // access). Treat as unauthenticated; caller will redirect to sign-in.
  if (!row) return null;

  return { userId, email, role: row.role };
});

export async function requireRole(min: AppRole): Promise<AuthedUser> {
  const user = await getAuthedUser();
  const locale = await getLocale();
  if (!user) {
    redirect(`/${locale}/sign-in`);
  }
  if (ROLE_RANK[user.role] < ROLE_RANK[min]) {
    redirect(`/${locale}?forbidden=1`);
  }
  return user;
}

export function roleAtLeast(role: AppRole, min: AppRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
