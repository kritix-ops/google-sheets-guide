import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

// libSQL is SQLite-compatible. In production we point at Turso over HTTPS;
// in local dev we fall back to a file URL so the existing developer flow
// (no Turso credentials required) keeps working. The `file:` scheme is
// handled by @libsql/client itself.
const url = process.env.TURSO_DATABASE_URL ?? "file:./.data/sheets-guide.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  ...(authToken ? { authToken } : {}),
});

export const db = drizzle(client, { schema });
export { schema };
