"use server";

import { signOut } from "@/auth";

// Server-side sign-out. Auth.js v5's REST signout endpoint requires a CSRF
// token in the request body; a plain fetch from the client misses it and
// silently fails to delete the session. The server-side `signOut()` runs
// inside Auth.js so CSRF and DB session cleanup are handled internally,
// then it throws a redirect that the framework propagates back to the
// client.
export async function signOutAction(locale: string): Promise<void> {
  await signOut({ redirectTo: `/${locale}/sign-in` });
}
