import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { db, schema } from "@/lib/db";

const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/script.projects",
  "https://www.googleapis.com/auth/script.scriptapp",
].join(" ");

const { allowedUsers, adminAudit } = schema;

// Sign-in gate. The `allowed_user` table is the single source of truth for
// who can sign in and what role they hold. Bootstrap path: when the table
// has no admin yet, an email listed in `AUTH_INITIAL_ADMINS` (comma-
// separated) is seeded as admin on its first sign-in and the action is
// recorded in `admin_audit`. After bootstrap, admins manage the allowlist
// through the admin UI; this env var stops mattering. See
// _plans/2026-05-11-admin-and-content-management.md.
async function checkOrBootstrap(email: string): Promise<boolean> {
  const existing = await db.query.allowedUsers.findFirst({
    where: eq(allowedUsers.email, email),
  });
  if (existing) return true;

  const anyAdmin = await db
    .select({ email: allowedUsers.email })
    .from(allowedUsers)
    .where(eq(allowedUsers.role, "admin"))
    .limit(1);
  if (anyAdmin.length > 0) return false;

  const initialAdmins = (process.env.AUTH_INITIAL_ADMINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!initialAdmins.includes(email)) return false;

  await db.transaction(async (tx) => {
    await tx.insert(allowedUsers).values({
      email,
      role: "admin",
    });
    await tx.insert(adminAudit).values({
      actorEmail: email,
      action: "bootstrap.initial_admin",
      target: email,
      afterJson: { role: "admin" },
    });
  });
  return true;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  session: { strategy: "database" },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      return checkOrBootstrap(email);
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  providers: [
    Google({
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
});
