import { and, eq } from "drizzle-orm";
import { google } from "googleapis";

import { db, schema } from "@/lib/db";

export type GoogleClients = {
  sheets: ReturnType<typeof google.sheets>;
  drive: ReturnType<typeof google.drive>;
  script: ReturnType<typeof google.script>;
};

export async function getGoogleClientsForUser(
  userId: string,
): Promise<GoogleClients> {
  const [account] = await db
    .select({
      access_token: schema.accounts.access_token,
      refresh_token: schema.accounts.refresh_token,
      expires_at: schema.accounts.expires_at,
    })
    .from(schema.accounts)
    .where(
      and(
        eq(schema.accounts.userId, userId),
        eq(schema.accounts.provider, "google"),
      ),
    );

  if (!account?.refresh_token) {
    throw new Error(
      `no Google refresh token stored for user ${userId}; sign out and sign in again to grant offline access`,
    );
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.AUTH_GOOGLE_ID,
    process.env.AUTH_GOOGLE_SECRET,
  );
  oauth2Client.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  // googleapis fires `tokens` whenever it acquires a fresh access_token via
  // refresh_token. Persist the new access_token + expiry so subsequent
  // requests don't trigger another refresh round-trip.
  oauth2Client.on("tokens", (tokens) => {
    void persistRefreshedTokens(userId, tokens);
  });

  return {
    sheets: google.sheets({ version: "v4", auth: oauth2Client }),
    drive: google.drive({ version: "v3", auth: oauth2Client }),
    script: google.script({ version: "v1", auth: oauth2Client }),
  };
}

async function persistRefreshedTokens(
  userId: string,
  tokens: { access_token?: string | null; expiry_date?: number | null; refresh_token?: string | null },
): Promise<void> {
  const updates: {
    access_token?: string;
    expires_at?: number;
    refresh_token?: string;
  } = {};
  if (tokens.access_token) updates.access_token = tokens.access_token;
  if (tokens.expiry_date) {
    updates.expires_at = Math.floor(tokens.expiry_date / 1000);
  }
  if (tokens.refresh_token) updates.refresh_token = tokens.refresh_token;
  if (Object.keys(updates).length === 0) return;

  await db
    .update(schema.accounts)
    .set(updates)
    .where(
      and(
        eq(schema.accounts.userId, userId),
        eq(schema.accounts.provider, "google"),
      ),
    );
}
