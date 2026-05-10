# Option B — Apps Script sidebar (in-sheet UI)

**Date:** 2026-05-10
**Status:** Approved, ready to start. Hebrew translations paused at 5/28 lessons (Track 1) until Option B is shipped.

---

## Goals

The user lives inside the spreadsheet while doing assignments. No alt-tab between Sheets and the web app during a lesson. The web app stays as the lesson library and account home.

Concretely:
1. Open a lesson in the web app → the app provisions the sheet *and* a bound Apps Script project, then opens Google Sheets with the sidebar already showing the lesson body, hint, and a "Grade my work" button.
2. The sidebar is the primary lesson surface during work. The web app tab is auxiliary (close-able).
3. Grading still runs server-side on Next.js. The sidebar's "Grade" button POSTs to `localhost:3000` and renders the result inline.

## Constraints

- Local-only deployment (`localhost:3000`). No public Vercel.
- Existing Auth.js Google OAuth, scopes already cover what we need: `spreadsheets`, `drive.file`, `script.projects`.
- Single user, no multi-tenancy concerns.
- Must not regress today's web-only flow — if the sidebar is closed, "Open your sheet" + "Grade my work" buttons in the web app still work as fallback.
- Hebrew/English locale must work in the sidebar identically to the web app.
- Apps Script sandbox is IFRAME mode (the only mode since 2020). Sidebar HTML loads from `*.googleusercontent.com`.

## Requirements

### Functional

1. **Sidebar provisioning.** When `POST /api/assignments/:id/start` runs, in addition to creating the spreadsheet, also:
   - Create a container-bound Apps Script project via `script.projects.create({ title, parentId: sheetId })`.
   - Upload three files via `projects.updateContent`:
     - `Code.gs` — `onOpen` adds a "Lesson" menu, `showSidebar` opens the sidebar.
     - `Sidebar.html` — minimal shell with an iframe pointing to `http://localhost:3000/{locale}/sidebar/{lessonId}?attemptId={id}&sheetId={id}`.
     - `appsscript.json` — manifest with the same OAuth scopes the user already granted, so re-consent is not triggered.
   - Open the sheet URL with `&pli=1` so the menu auto-runs (acceptable degradation: user clicks "Lesson → Show" once on first open).
2. **Sidebar UI.** A new Next.js route `/{locale}/sidebar/[id]/page.tsx` renders:
   - Lesson title and breadcrumb (compact)
   - Lesson body (the same MDX as the main lesson page, but in a narrower layout)
   - The assignment task description
   - "Grade my work" button → POSTs to existing `/api/assignments/:id/grade` with the `attemptId`
   - Inline feedback rendering (re-uses `FeedbackCard`)
3. **CSP/iframe embedding.** Next.js page `sidebar/[id]` must respond with headers that allow framing from `https://*.googleusercontent.com` (the Apps Script sandbox host). Use Next.js `headers()` config in `next.config.ts` scoped to that path.
4. **Auth in the sidebar iframe.** The Next.js sidebar route must work without a session cookie if the cookie can't cross frames. Three options below in "Open questions" — picking one is the riskiest call in this plan.
5. **Locale.** The sidebar URL carries `{locale}` from the user's current default. The lesson body renders in that locale (with EN fallback for un-translated lessons, same as the web app).
6. **Fallback.** The existing web-app `AssignmentPanel` continues to work. "Start assignment" still shows "Open your sheet" / "Grade my work" buttons.

### Non-functional

- Provisioning latency: sidebar should show within ~2 seconds of opening the sheet on first load.
- No new paid services. (Apps Script API is free; quotas verified below.)
- No hard dependency on a Google Workspace account — consumer Google works.

## Costs and quotas verified

- Apps Script API (`projects.create`, `projects.updateContent`): no per-request fee. Standard quotas apply (well below our usage of ~1 call per lesson start).
- Sidebar iframe communicates with localhost via `fetch`, which runs in the Apps Script sandbox iframe's JS context — *not* via `UrlFetchApp` — so the 20,000/day UrlFetchApp quota is irrelevant.
- Sandbox iframe to localhost CORS: localhost origin allows credentials? Verified in implementation by allowing the googleusercontent origin.
- No new third-party services introduced. No per-token AI cost change (grading remains the same).

## Architecture

```
┌─────────────────────────────────┐
│ Browser tab                     │
│  ┌────────────┐ ┌─────────────┐ │
│  │ Spreadsheet│ │  Sidebar    │ │
│  │  (Google)  │ │  iframe →   │ │  http://localhost:3000/he/sidebar/...
│  │            │ │  localhost  │ │
│  └────────────┘ └─────────────┘ │
└─────────────────────────────────┘
         │             │
         │             ▼
         │       Next.js dev server (existing)
         │       /sidebar/[id] route (new)
         │       /api/assignments/[id]/grade (existing, reused)
         │
         ▼
   Sheets API (read for grading, existing)
```

### What's new

- `lib/google/script.ts` — wraps `googleapis.script` for `projects.create` + `projects.updateContent`.
- `lib/google/appscript-template/` — directory with the three files (`Code.gs`, `Sidebar.html`, `appsscript.json`) as raw strings or `.txt` resources, with `{LESSON_ID}` / `{LOCALE}` / `{LOCALHOST_URL}` placeholders.
- `app/[locale]/(app)/sidebar/[id]/page.tsx` — sidebar-shaped lesson view.
- `app/api/assignments/[id]/start/route.ts` — extended to also call `provisionSidebarScript` after `provisionAssignmentSheet`. Wrap in `try/catch` so a sidebar failure doesn't block the sheet from being usable; surface a warning toast.
- `next.config.ts` — `headers()` entry that loosens `X-Frame-Options` / `Content-Security-Policy: frame-ancestors` for `/sidebar/*`.
- `lib/google/client.ts` — return a `script` client too, alongside `sheets` and `drive`.

### What's reused

- Existing `auth.ts` and OAuth scopes (no re-consent).
- `AssignmentPanel`, `FeedbackCard`, MDX lesson loader (`registry.ts`).
- `/api/assignments/[id]/grade` — sidebar calls this directly.
- All grading rules (`AssignmentSpec.rules` is content-only).

## Approach: Alternative 1 (Minimal sidebar)

Per the alignment conversation:
- **Sidebar-only**: web app is the library, sidebar is primary during work
- **Iframe to localhost**: lesson body lives in the existing Next.js MDX, no duplication
- **Programmatic install**: each "Start assignment" creates the bound script via API
- **Server-side grading**: unchanged

## Alternatives rejected

### Native HtmlService templates (Alt 2 from alignment)
**Rejected.** Forces duplicating every MDX lesson into Apps Script `.html` files. Massive content duplication, separate deploy story, no Next.js component reuse.

### Workspace add-on for distribution (Alt 3)
**Rejected.** User is local-only. OAuth verification adds weeks. Nothing to distribute.

### One shared Apps Script project for all sheets
**Rejected.** Container-bound scripts are cleaner: each lesson sheet has its own bound script with the right `onOpen` menu. Cleanup is automatic when the user deletes the sheet. A standalone shared script would require manual `addOns` install per sheet — more friction.

### Server-Sent Events / polling for "live grading"
**Rejected for Option B v1.** Same reason as before: on-edit triggers add complexity for marginal value over manual "Grade my work."

## Open questions (must resolve before code)

### 1. How does the localhost iframe authenticate?
The sidebar iframe loads `http://localhost:3000/.../sidebar/...`. The existing Auth.js session cookie is `SameSite=lax`, which means it **does not flow** when embedded as a third-party iframe (the parent is `googleusercontent.com`). Without a session, the API calls fail with 401.

Three options:
- **A. Short-lived signed token in URL.** When provisioning the sidebar, generate a per-attempt signed JWT, embed it in the iframe URL as a query param. The Next.js sidebar route validates it, mints a temporary session for that request only. Tokens expire with the attempt.
- **B. Loosen the cookie to `SameSite=None; Secure`.** Lets the cookie flow into the iframe. But requires HTTPS — `localhost` isn't HTTPS, browsers will reject. So this requires either `mkcert` setup or skipping cookie auth in iframe.
- **C. Skip auth in the sidebar iframe entirely.** Trust the `attemptId` in the URL. Already-authorized users created the attempt; the attempt row knows the userId. The grading endpoint validates that the attempt belongs to a real user without rechecking session.

Recommendation: **C, then upgrade to A if needed.** Localhost-only, single user, the worst case is "someone in the same room makes the user grade an arbitrary attempt" — not a real threat model on a personal machine. If we ever leave localhost, A is the right path.

### 2. Where does the sidebar route mount?
- Inside `(app)` group → inherits TopBar/Sidebar layout, which is wrong for the iframe.
- Outside `(app)` group at `app/[locale]/sidebar/[id]/page.tsx` → no layout chrome, lean shell. **Pick this.**

### 3. Apps Script API enablement
The Apps Script API needs to be enabled in the Google Cloud project that owns our OAuth client. Verify in the console *before* building, otherwise `projects.create` returns 403.

### 4. Caja sandbox CSP
The sandbox iframe content-security-policy may block embedding non-Google iframes. Empirically test this in Phase 1.1 before committing to the architecture.

## Build phases

### Phase 1 — Spike (1 session, ~3-4 hours)
Prove the riskiest assumption: that an Apps Script sidebar can iframe a localhost URL and that localhost can call back to itself. If it can't, we re-plan.

- Hand-create a sheet in Google Drive
- Hand-create a bound Apps Script project on it
- Paste in a minimal sidebar HTML with `<iframe src="http://localhost:3000/test-sidebar">`
- Verify the iframe loads
- Add a fetch from inside the localhost page to `localhost:3000/api/test` and verify it works
- Add a "Grade my work" button that calls `/api/assignments/.../grade`
- Result: green light or re-plan

### Phase 2 — Programmatic provisioning (1 session)
- `lib/google/script.ts` — `provisionSidebarScript({ sheetId, lessonId, locale, scriptClient })`
- Templates for `Code.gs` + `Sidebar.html` + `appsscript.json`
- Extend `lib/google/client.ts` to return a `script` client
- Extend `start` route to call provisioning, with try/catch fallback
- Smoke test: click Start, sheet opens with sidebar populated

### Phase 3 — Sidebar route in Next.js (1 session)
- `app/[locale]/sidebar/[id]/page.tsx` — lesson body + Grade button
- `next.config.ts` — relax `frame-ancestors` for `/sidebar/*`
- Style for narrow viewport (Apps Script sidebar is ~300px wide)
- Handle EN/HE locale, RTL when locale=he

### Phase 4 — Auth in iframe (1 session)
- Implement option C from open question 1: validate `attemptId`, no session needed
- `/api/assignments/:id/grade` accepts an `attemptId` and looks up the user from there (already does this, verify)
- End-to-end test: open sheet, click Grade, see feedback

### Phase 5 — QA + polish (1 session)
- Per CLAUDE.md rule 6: walk every flow (golden path, edge cases, error paths)
- Sidebar fails to provision → user can still use web-app fallback
- Sheet opened without sidebar (user closed it) → Lesson menu re-opens it
- Grading from the sidebar matches grading from the web app, exactly
- Locale toggle: switching between EN/HE in the web app does not break the sidebar of an in-progress attempt (sidebar's locale is fixed when provisioned)

### Phase 6 — Resume Hebrew translations
Continue from lesson 06.

**Total estimated: 5 sessions (~15-20 hours of focused work).**

## Risks

- **Caja sandbox blocks the iframe** — mitigation: Phase 1 is a spike, kill the architecture early if it fails.
- **Apps Script API quota or auth wrinkle** — mitigation: small request volume, scope already granted.
- **Next.js `frame-ancestors` doesn't take effect on dev server** — mitigation: verify in Phase 3, fall back to setting headers via middleware if `next.config.ts` doesn't apply in dev.
- **Iframe-in-sidebar latency feels janky** — mitigation: pre-warm the localhost route, use `<link rel="preconnect">` from the Apps Script HTML.

## Decision log

- **2026-05-10:** Option B chosen, iterating from `_plans/2026-05-09-sheets-tutor.md` line 273-274 (deferred). Hebrew translations paused at 5/28 to clear runway.
- **2026-05-10:** Sidebar-only (not mirrored), iframe to localhost (not native HTML), grading stays server-side, programmatic install via `script.projects` scope (already granted in `auth.ts:13`).
