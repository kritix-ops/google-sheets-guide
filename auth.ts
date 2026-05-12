import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

import { db, schema } from "@/lib/db";

// Least-privilege OAuth scopes. `drive.file` grants per-file access to
// files the app created or the user explicitly opened with the app —
// every Sheets call we make is on an app-provisioned spreadsheet, so we
// do NOT need the broad `auth/spreadsheets` scope (which grants read+
// write on every spreadsheet the user owns). The Apps Script scopes
// cover provisioning the in-sheet sidebar's bound project.
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
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

  const initialAdmins = (process.env.AUTH_INITIAL_ADMINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (!initialAdmins.includes(email)) {
    // Even if no admin exists yet, refuse anyone not on the env allowlist.
    return false;
  }

  // Bootstrap path: insert this user as admin only if no admin exists yet.
  // Wrap the no-admin check AND the insert inside one transaction so two
  // simultaneous initial sign-ins can't both win the "first admin" race.
  // The unique primary key on email means a duplicate insert throws; we
  // treat that as "already bootstrapped by someone else" and return false.
  try {
    return await db.transaction(async (tx) => {
      const anyAdmin = await tx
        .select({ email: allowedUsers.email })
        .from(allowedUsers)
        .where(eq(allowedUsers.role, "admin"))
        .limit(1);
      if (anyAdmin.length > 0) return false;

      await tx.insert(allowedUsers).values({ email, role: "admin" });
      await tx.insert(adminAudit).values({
        actorEmail: email,
        action: "bootstrap.initial_admin",
        target: email,
        afterJson: { role: "admin" },
      });
      return true;
    });
  } catch {
    return false;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  // The account refresh/access/id_token columns use Drizzle's customType
  // for transparent at-rest encryption (see lib/db/encrypted-text.ts). At
  // runtime they serialize as strings, which is what DrizzleAdapter
  // expects, but the static type widens to SQLiteCustomColumn instead of
  // SQLiteText. The cast below is targeted at that mismatch; the
  // adapter's actual reads/writes work fine.
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accountsTable: schema.accounts as any,
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
