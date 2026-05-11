import { DrizzleAdapter } from "@auth/drizzle-adapter";
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

// Allowlist of emails permitted to sign in. Single-user app: defaults to
// open (any email) when unset so local development works without ceremony,
// but production deploys MUST set this to lock the public URL down. See
// _plans/2026-05-11-hosted-deployment.md Issue B.
function isEmailAllowed(email: string | null | undefined): boolean {
  const raw = process.env.AUTH_ALLOWED_EMAILS;
  if (!raw) return true;
  const allowed = raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return allowed.includes((email ?? "").toLowerCase());
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
      return isEmailAllowed(user.email);
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
