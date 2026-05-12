import { customType } from "drizzle-orm/sqlite-core";

import { decryptToken, encryptToken } from "./crypto";

// Drizzle custom column type that transparently encrypts on write and
// decrypts on read. Stored as TEXT in SQLite; from the application's
// perspective it's just a string column. Used for the Auth.js account
// token columns so plaintext OAuth refresh/access/id tokens never sit at
// rest in libSQL.

export const encryptedText = customType<{ data: string; driverData: string }>({
  dataType() {
    return "text";
  },
  toDriver(value: string): string {
    return encryptToken(value);
  },
  fromDriver(value: string): string {
    return decryptToken(value);
  },
});
