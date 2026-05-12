# QA fix execution plan — 2026-05-12

Sourced from the seven-agent QA pass run 2026-05-12. Verdict was RED on security,
mostly green/yellow elsewhere. This plan executes every finding from Critical
through Low, in priority order.

Approved scope (user, 2026-05-12):

- C2 (middleware): Node-runtime middleware that validates session via DB.
- M3 (token encryption): AES-GCM keyed from AUTH_SECRET, encrypt all OAuth tokens.
- H5/H6 (pedagogy reworks): Full rework of lessons 1.27 and 1.12 in EN + HE.

## Order of operations

### Critical — block any non-localhost deploy

- **C1** Sign attempt tokens at provision time; validate on grade. Tighten
  `proxy.ts` `PUBLIC_API_PATTERNS`. Add a basic per-attempt rate-limit.
- **C2** Node-runtime middleware that calls `auth()` and validates the session
  against the DB. Edge runtime no longer guards anything.
- **C3** Throw `PublishConfigError` if any of `GITHUB_PAT`, `GITHUB_REPO_OWNER`,
  `GITHUB_REPO_NAME` is missing. No hardcoded fallback to `kritix-ops`.

### High — fix this sprint

- **H1** Validate `locale` query param against `routing.locales` in the two
  start routes that pipe it into the Apps Script sidebar HTML.
- **H2** Wrap user-derived strings going into the Claude judge prompt in
  `<cell_content>...</cell_content>` delimiters. Strip control chars, clamp
  length. Assert explicitly that the judge can never override
  `rulesResult.passed`.
- **H3** Cap `lessonDrafts.content` length at 256KB at the action boundary.
- **H4** Expand `VERTICALS_LOOKUP` in `content/datasets/adtech.ts` to cover all
  19 verticals used in `CAMPAIGNS_LARGE`.
- **H5** Rework `formulas/27-import-family` in EN + HE: add StepThrough for the
  auth handshake, MiniGrid for spilled output, QuickCheck per major section,
  Compare for IMPORT* family use-cases.
- **H6** Rework `formulas/12-query-fundamentals` in EN + HE: add toy `<RefDemo>`,
  `<StepThrough>` for the multi-clause evaluation, result-side `<MiniGrid>`,
  add interactive to `## SELECT`.

### Medium

- **M1** Security headers in `next.config.ts`: CSP (frame-ancestors for the
  Apps Script sidebar), HSTS, X-Content-Type-Options, Referrer-Policy,
  Permissions-Policy.
- **M2** Narrow Google OAuth scope to `drive.file` only, if grading only
  touches app-provisioned sheets. Verify first; if it reads user-owned sheets
  via IMPORTRANGE flows, keep `auth/spreadsheets` and document why.
- **M3** Application-level AES-GCM encryption of `refresh_token`,
  `access_token`, `id_token` columns. Key derived from `AUTH_SECRET` via HKDF.
  Migration for existing rows.
- **M4** Wrap the bootstrap-admin check in a single transaction with a write
  guard so two simultaneous initial sign-ins can't both insert.
- **M5** Rename `scripts/registry-check.mjs` → `.ts`, wire `registry:check`
  npm script that invokes via `tsx`.
- **M6** Sharpen AI-in-Sheets pricing language with the explicit July 15, 2026
  promotional-limits cutoff date. Reverify the 350-cell-per-batch claim.
- **M7** Weave IMPORTRANGE awareness into `formulas/10-arrayformula-basics`.
- **M8** Weave IMPORTRANGE awareness into `formulas/01-grid-model`.

### Low / hygiene

- **L1** Explicit `.env*` / `!.env.example` in `.gitignore`.
- **L2** Delete `app/api/test-ping/`.
- **L3** Validate `locale` against `routing.locales` in `signOutAction`.
- **L5** Bump `tsconfig.json` target from `ES2017` to `ES2022`.
- **L6** Trim 28 orphan registry entries down to those the curriculum actually
  cites within the next track expansion; defer the rest.
- **L7** Remove unused `Prose` export from `components/lesson/index.ts` and
  `mdx-components.tsx`.

### Verification

After all fixes:

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- Smoke test the dev server: grade endpoint rejects unsigned/expired tokens;
  protected pages 401 without session; locale validation rejects bogus values.

## Out of scope this turn

- The 350-cell verification (M6 second half) requires live Workspace docs and
  is deferred to a content-only pass.
- Trimming the 28 orphan registry entries (L6) requires a product call on
  which functions get future lessons; defer.
- Apps Script `LockService` lesson addition: scoping for a future lesson, not
  a fix.
