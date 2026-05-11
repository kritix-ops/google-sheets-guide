import { defineConfig } from "drizzle-kit";

// Dialect is `turso` for the hosted path (Turso/libSQL) and the same config
// works against a local file via drizzle-kit's `file:` URL form.
// In local dev with no Turso creds, drizzle-kit falls back to the file URL.

const url = process.env.TURSO_DATABASE_URL ?? "file:./.data/sheets-guide.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

export default defineConfig({
  out: "./drizzle",
  schema: "./lib/db/schema.ts",
  dialect: "turso",
  dbCredentials: {
    url,
    ...(authToken ? { authToken } : {}),
  },
});
