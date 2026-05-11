# Hosted deployment on Vercel

Date: 2026-05-11
Status: planning

## Goal

Make the curriculum app reachable at a public Vercel URL while preserving the
single-user grading model. Migrate from local-only SQLite to a hosted-compatible
data store. Wire Google OAuth for the Vercel domain. Keep the Apps Script
sidebar (Option B) working when running against the hosted app.

## Constraints

- **Single-user, sensitive scopes.** Google `spreadsheets`, `drive.file`, and
  `script.projects` scopes are powerful. The hosted app must only be usable by
  the owner: no public sign-up, no shared accounts.
- **Cost ceiling.** Free tier of every dependency. Anthropic usage stays as-is
  (per-grade-call cost is the same regardless of host).
- **Zero-downtime tolerable.** This is a personal app. Brief downtime during
  cutover is fine.
- **Branch previews can be lax.** Production must be locked down; ephemeral
  preview deployments can stay behind Vercel's protection.

## Requirements

- Sign in via Google works on the production Vercel URL.
- The full grade loop (provision sheet, edit sheet, click "Grade", see results)
  works end-to-end.
- The bound Apps Script sidebar continues to provision and render against the
  hosted app's `/sidebar/...` route.
- Database persists per-user state (attempts, grades, sessions, OAuth tokens)
  across serverless invocations.
- No secret leaks: `.env.local` stays gitignored; production secrets live only
  in Vercel env vars.

## Architecture changes

### 1. Database: SQLite (better-sqlite3) → libSQL (Turso)

`better-sqlite3` needs a persistent local filesystem. Vercel serverless
functions are stateless. The migration target is **Turso** (libSQL): a
SQLite-compatible HTTP API. Drizzle already ships an `@libsql/client`
adapter; the schema and existing migrations move over without modification
because libSQL speaks the same SQL dialect as SQLite (including
`unixepoch()`, `WITHOUT ROWID`, FK semantics).

**Why not Vercel Postgres / Neon?** Postgres needs a schema rewrite
(timestamps, `unixepoch()` replacement, JSON column mode). Larger blast
radius, more risk, no functional benefit for a single-user app.

**Why not D1 / Cloudflare?** Vercel + Cloudflare DB adds a cross-cloud
hop. Turso has Vercel-region edge replicas and is operationally simpler.

Turso free tier: 9GB storage, 500M row reads/month, 50M writes/month.
Forever free for one user.

### 2. Auth.js: keep DrizzleAdapter, database session strategy

No changes. The adapter works against any Drizzle-supported driver. The
existing `lib/db/schema.ts` Auth.js tables (users, accounts, sessions,
verificationTokens) stay as-is.

### 3. Google OAuth client: add production redirect URI

In Google Cloud Console (the same OAuth client `.env.local` already uses),
add the production redirect URI:

```
https://<production-url>/api/auth/callback/google
```

Wildcards are not supported by Google. Preview deployments will not be able
to complete the OAuth round-trip unless their URL is also added (one-off,
per preview). For day-to-day work we accept this limitation: preview
deploys are for visual review, not for testing the auth flow.

### 4. Apps Script sidebar: cross-origin iframe from googleusercontent

The Apps Script bound project hosts a thin HTML shell that iframes our app's
`/[locale]/sidebar/[lessonId]` route. Two concerns:

- **Vercel's frame-ancestors.** Next.js by default sets no `X-Frame-Options`,
  so iframing from `script.googleusercontent.com` works without changes. For
  hardening we will add an explicit
  `Content-Security-Policy: frame-ancestors 'self' https://*.googleusercontent.com`
  on the `/sidebar/...` route only.
- **The sidebar API endpoint already allowlisted.** `proxy.ts` already lets
  `/[locale]/sidebar/...` and `/api/sidebar/...` bypass session-cookie
  validation, so the iframe (which can't carry our session cookie) hits the
  attemptId-token-based grading path.

No code changes needed for the sidebar to work hosted, beyond the
production URL bake-in for the iframe `src`.

### 5. Migrations: run on every build

Add `drizzle-kit migrate` to the build step so production schema stays in
sync with the repo:

```json
"scripts": {
  "vercel-build": "drizzle-kit migrate && next build"
}
```

This is idempotent (drizzle-kit's `_journal.json` tracks applied
migrations); safe to run on every deploy.

## Security plan

Per CLAUDE.md rule 13. Threat model: hosted single-user app with Google scopes.

- **Sensitive data.** OAuth refresh tokens (long-lived; can re-mint access tokens
  for the user's Drive/Sheets), session tokens. Both stored in Turso under
  Auth.js's standard tables.
- **Attack surface.** Public HTTPS URL; sign-in flow; per-attempt grade and
  start endpoints; sidebar grade endpoint allowlisted.
- **Access control.** All non-public routes require a valid Auth.js session.
  Public allowlist limited to `/sign-in`, `/api/auth/*`, `/[locale]/sidebar/*`,
  `/api/sidebar/*` (sidebar uses attemptId-as-token; see Issue A below).
- **Secret handling.** Vercel env vars (encrypted at rest), never committed.
  `AUTH_SECRET` freshly generated for prod (not reused from `.env.local`).
- **Input validation.** Existing route handlers validate `attemptId`, assignment
  IDs, and assert `attempt.userId === session.user.id` for the
  authenticated endpoints. Sidebar endpoint validates `attempt.userId`
  matches the OAuth credential owner.
- **Logging.** Drizzle queries don't log payloads by default; route handlers
  don't log request bodies. Auth.js logs sign-in events. No PII logged.

### Issue A: sidebar attemptId-as-token (open question)

The sidebar's `/api/sidebar/grade` route is allowlisted because the Apps Script
iframe can't carry our SameSite=lax session cookie. The current authorization
model is: trust the attemptId, load `attempt.userId`, load that user's OAuth
credentials. **This is acceptable for the local-only build. For hosted, it's
weaker than ideal**: anyone with a valid attemptId can grade that attempt as
if they were the owner. In practice the attemptId space is unguessable (small
integer space, but with rate-limited public exposure), and the worst-case
abuse is "stranger grades my sheet and writes a grade row" rather than data
exfiltration.

For the initial hosted deploy: keep the current model, accept the risk for
one user. Track 3 (Apps Script) lesson on sidebars or a future iteration will
swap this for a signed token passed in the iframe URL at provision time.

### Issue B: production-only sign-in allowlist

Single-user app, but public URL. Without further gating, anyone can hit the
sign-in page and try to sign in with their own Google account. The DrizzleAdapter
would create user rows for them. They wouldn't have OAuth refresh tokens with
the right scopes (the scopes are requested by our flow, but a stranger could
grant them with their own account).

**Mitigation**: add a sign-in callback that rejects sign-ins from emails not
in an allowlist (`AUTH_ALLOWED_EMAILS` env var, comma-separated).

```ts
callbacks: {
  async signIn({ user }) {
    const allowed = (process.env.AUTH_ALLOWED_EMAILS ?? "").split(",");
    return allowed.includes(user.email ?? "");
  },
}
```

Owner email goes in `AUTH_ALLOWED_EMAILS`. Anyone else gets bounced at
sign-in. This stays in the codebase even after switching to Option B, since
the sign-in surface is web-app-only either way.

## Env vars (Vercel project settings)

| Name | Source | Notes |
|---|---|---|
| `AUTH_SECRET` | Generate fresh: `node -e "console.log(crypto.randomBytes(32).toString('hex'))"` | Don't reuse `.env.local` |
| `AUTH_URL` | `https://<production-url>` | Optional in Auth.js v5; explicit for clarity |
| `AUTH_GOOGLE_ID` | GCP Console | Same as `.env.local` |
| `AUTH_GOOGLE_SECRET` | GCP Console | Same as `.env.local` |
| `AUTH_ALLOWED_EMAILS` | `info@flexelent.com` (the owner) | Comma-separated allowlist |
| `ANTHROPIC_API_KEY` | console.anthropic.com | Same as `.env.local` |
| `TURSO_DATABASE_URL` | `turso db show <name> --url` | New |
| `TURSO_AUTH_TOKEN` | `turso db tokens create <name>` | New; long-lived |

## Migration plan (execution steps)

1. **Code: swap the DB driver.** `lib/db/index.ts` rewires to libsql. Local
   dev keeps working: if `TURSO_DATABASE_URL` is unset, fall back to a local
   `file:./.data/sheets-guide.db` URL (libSQL supports file URLs too).
2. **Code: drizzle.config.ts.** Switch dialect to `turso`; credentials from
   env.
3. **Code: package.json.** Add `vercel-build` script with migrations.
4. **Code: auth.ts.** Add the `signIn` callback for the allowlist.
5. **Code: .env.example.** Add the new vars.
6. **Local test.** Set up a personal Turso db, point at it, run the full
   sign-in + grade flow locally to verify the migration didn't break
   anything.
7. **GCP Console.** Add the production redirect URI to the Google OAuth
   client.
8. **Vercel.** Set all env vars in the project settings.
9. **Push.** The `vercel-build` script runs migrations on Turso; Next.js
   builds; deploy goes live.
10. **Verify.** Sign in on the production URL; provision a lesson; grade it;
    confirm both rows wrote to Turso.

## Rejected alternatives

- **Postgres (Vercel Postgres / Neon).** Larger migration (timestamp modes,
  `unixepoch()`, JSON column dialect). Single-user app: no benefit over libSQL.
- **Disable hosting; stay local.** Already considered; the user's pivot to
  "make it work on Vercel" rules this out.
- **Custom auth (just a password / signed cookie).** Auth.js + Google OAuth is
  load-bearing because the same OAuth tokens drive Sheets/Drive/Apps Script
  API calls. Replacing it would require a parallel token-management layer.

## Out of scope (for this iteration)

- Custom domain on Vercel (skip; use the default `*.vercel.app` URL).
- Branch-preview OAuth (skip; only production needs sign-in to work).
- Sidebar signed-token authorization (deferred; documented in Issue A).
- CI: GitHub Actions running the test suite on PRs (deferred; out of scope
  for this hosting cutover).
