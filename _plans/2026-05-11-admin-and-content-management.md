# Admin and content management — 2026-05-11

## Goals

Add two capabilities to the Google Sheets curriculum app:

1. **User management.** Add, remove, and assign roles to users without redeploying. Replace the current env-var `AUTH_ALLOWED_EMAILS` with a DB-managed allowlist.
2. **Content management.** Edit lesson prose in both Hebrew and English from inside the app. Each edit goes through a draft → preview → publish flow and ships as a git commit (Vercel rebuilds).

## Constraints

Locked by the alignment conversation 2026-05-11:

- **Audience**: you plus 1-2 trusted editors. Roles needed: `admin`, `editor`, `viewer`.
- **Storage**: lessons stay as MDX files in the repo. Edits get committed via the GitHub API; Vercel redeploys.
- **Workflow**: draft → preview → publish. Single-admin approval (no two-eye rule for v1).
- **Priority**: both features in a single milestone.

## Requirements

- Bilingual editing (HE + EN). Reasonable for an editor to see both at once.
- All admin endpoints authorize **server-side**, not just hide UI client-side.
- Edits are durable. A browser crash mid-edit must not lose work (autosave drafts to DB).
- A bad edit must be revertable. Git history is the audit log; the publish action writes commits with editor name + lesson slug in the message.
- The first admin (you) must be able to bootstrap without anyone else granting access.
- Editors should not be able to break the interactive components (`<MiniGrid>`, `<RefDemo>`, `<TryIt>`, etc.) by accident. They edit prose, not the component scaffold.

## Architecture: roles and access

Add a `role` column to the existing `user` table:

```ts
role: text("role").$type<"admin" | "editor" | "viewer">().notNull().default("viewer")
```

Replace the env-var allowlist with a DB table:

```ts
allowedUsers = sqliteTable("allowed_user", {
  email: text("email").primaryKey(),
  role: text("role").$type<"admin" | "editor" | "viewer">().notNull(),
  addedBy: text("added_by").references(() => users.id),
  addedAt: integer("added_at", { mode: "timestamp_ms" }).default(...).notNull(),
})
```

Sign-in flow (`auth.ts` `signIn` callback):

1. Is the email in `allowed_users`? If yes, allow the sign-in and stamp the user's `role` from the row.
2. Is the email in the new env var `AUTH_INITIAL_ADMINS` (comma-separated)? If yes, allow and assign `admin`. (Bootstrap path; only fires when `allowed_users` is empty or for explicit re-bootstrap.)
3. Otherwise reject.

`AUTH_ALLOWED_EMAILS` deprecates. We keep reading it as a fallback for one deploy cycle, then remove.

### Admin UI for users

Routes (under `/admin/users`):
- `GET /admin/users` — list, search, filter by role.
- `POST /admin/users` — add a new email + role (admins only).
- `PATCH /admin/users/[email]` — change role.
- `DELETE /admin/users/[email]` — remove from allowlist (their existing session expires next time it refreshes).

Server-side guard on every endpoint: `requireRole("admin")` middleware that reads the session and 403s if the user isn't an admin.

## Architecture: content editing

Three real alternatives for the editor experience, ranked by engineering cost:

### Alt A — Raw MDX editor (textarea / Monaco)

Editor sees the file's raw MDX, types into a code-editor pane, saves to a draft, publishes to a commit.

- **Pros**: minimal engineering. Full power: editor can change anything including components. Familiar to anyone who has used GitHub's web editor.
- **Cons**: editors must know MDX syntax. An editor who fat-fingers a `<MiniGrid>` prop breaks the lesson. MDX is JSX, which means an editor with intent can inject arbitrary JS that runs in users' browsers at build time. Hard to bilingual-side-by-side because raw MDX gets noisy.

### Alt B — Markdown-only editor with frozen components (Recommended)

Parse the MDX file into prose blocks and component blocks. Editor sees a rendered preview where prose is editable inline and components show as locked placeholders ("[MiniGrid: campaign log]"). Saves merge edits back into the original MDX, preserving component placement.

- **Pros**: prose-safe — editor cannot break components by accident or on purpose. Side-by-side HE/EN works naturally because prose blocks pair cleanly between languages. WYSIWYG-ish preview is intuitive.
- **Cons**: medium engineering. Needs an MDX-AST parser (`@mdx-js/mdx` exposes one) and round-trip serialization. Some edge cases when an edit changes paragraph count (inserting / removing whole sections).
- **Why recommended**: lowest blast radius if an editor goes off-script, best UX for non-MDX-fluent editors, supports the bilingual side-by-side affordance.

### Alt C — Structured fields editor

Each lesson is broken into discrete editable fields by section heading (title, intro, body H2 sections, captions, bullet items). Each field has its own textarea. Components are invisible to the editor.

- **Pros**: most idiot-proof. Future-proofs into a real CMS.
- **Cons**: highest engineering cost. Requires a schema for what fields exist per lesson type — and lessons in this curriculum have wildly different shapes (some have 0 components, some have 10).
- **Why not for v1**: the curriculum's lesson shapes are too varied. Forcing every lesson into a field schema would either break the diversity or balloon the schema.

### Recommendation

Build **Alt B** (Markdown-only with frozen components). Engineering investment is moderate and pays off in editor safety and bilingual UX. If you later need editors to touch component props (e.g., change which cells are highlighted), upgrade to Alt C selectively for those lessons.

### Considered and rejected: headless CMS

There's a viable "buy not build" option: **Decap CMS** (formerly Netlify CMS) or **TinaCMS** — git-backed visual editors that drop into the repo and produce a `/admin` route with login and a markdown editor.

- **Pros**: free, mature, solves exactly this problem, draft/publish workflow built in.
- **Cons that matter for us**:
  - Auth is separate. Decap uses GitHub OAuth; TinaCMS has its own. Your NextAuth-Google sessions wouldn't gate Decap. You'd end up with two auth systems.
  - Roles tied to GitHub team membership (Decap) or Tina's billing tier (paid for >2 users on Tina). Doesn't reuse your `allowedUsers` table.
  - UX is generic. The admin won't share visual language with your app's design.
  - The lessons use custom MDX components (`<MiniGrid>` etc.). Decap can be configured to allow them but it shows them as raw blocks, not previews.
- **Decision**: custom Next.js admin wins because the app already has NextAuth + Drizzle + a design system, and we want roles tied to the same user system as `attempts`/`grades`. Decap would force a parallel auth.

### Data model for the editor

```ts
lessonDrafts = sqliteTable("lesson_draft", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Path components, e.g. "formulas/01-grid-model"
  track: text("track").notNull(),
  slug: text("slug").notNull(),
  // "en" or "he"
  lang: text("lang").$type<"en" | "he">().notNull(),
  // The proposed new MDX content
  content: text("content").notNull(),
  authorId: text("author_id").references(() => users.id).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(...).notNull(),
  // Set when published; null when still a draft.
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  // The git commit SHA that landed the published version, if any.
  publishedCommit: text("published_commit"),
})
```

Unique constraint: `(track, slug, lang, authorId)` while `publishedAt IS NULL`. So each editor has at most one active draft per lesson per language. (Two editors can have parallel drafts on the same lesson; the second one to publish wins, the first sees a conflict warning.)

### Flow

1. Editor visits `/admin/content/[track]/[slug]`.
2. UI loads the current published MDX (from `content/{lang}/lessons/{track}/{slug}/lesson.mdx`) plus any existing draft for this editor.
3. Editor types. Autosave fires every 5 seconds to `POST /api/admin/drafts/[id]` (server-side role check first).
4. "Preview" button compiles the draft MDX in-process and renders it on a hidden preview route gated by the same role check.
5. "Publish" button:
   - Server pulls the draft from DB.
   - Validates: MDX compiles, no path traversal in slug, prose-only edits preserved the component structure.
   - Calls the GitHub API (Octokit, authenticated with a GitHub App or PAT) to commit the new MDX to `content/{lang}/lessons/{track}/{slug}/lesson.mdx` on `main`.
   - Commit message: `Edit lesson: {track}/{slug} ({lang}) — via admin by {author.name}`. Co-author trailer for audit.
   - Stamps `publishedAt` + `publishedCommit` on the draft row. (We don't delete drafts; they become the audit history.)
   - Vercel detects the push and rebuilds. Typically live in 30-60 seconds.
6. UI shows "Published; live in ~1 min" plus the commit SHA + link.

### Bilingual UX

Side-by-side panes, HE on the right (RTL-aware), EN on the left. Each pane has its own draft state but shares scroll position when the editor toggles a "sync scroll" checkbox. The MDX structure of HE and EN files is required to stay parallel — the editor warns when prose-block counts diverge.

## Security plan

Per CLAUDE.md rule 13. Designing in from day one.

### Authorization
- Every admin API route: server-side check on session role. Use a `requireRole(...)` middleware in `app/admin/_lib/auth.ts`.
- Pages that render admin UI also check role server-side via the route's `layout.tsx` or `page.tsx` server component.
- Defense in depth: middleware at `/admin/*` redirects unauthenticated requests; the page-level check protects authenticated viewers who aren't admins/editors.

### Input validation
- Slug + track in URL must match the allowlist of known lessons (`content/{en,he}/lessons/**`). No path traversal.
- MDX content must compile before publish.
- Component scaffold preservation: parse both pre-edit and post-edit MDX, compare component nodes. Reject if they differ (Alt B model).

### Secrets
- `GITHUB_PAT` or `GITHUB_APP_PRIVATE_KEY` in Vercel env vars. Never sent to client. Used only by server actions.
- Initial admin emails: `AUTH_INITIAL_ADMINS` env var.

### XSS / MDX injection
- Alt B prevents editors from changing component nodes, which is where JS injection risk lives. Prose-only edits compile to text, not JS.
- Even so, on publish: parse the resulting MDX, ensure no new `<script>` tags, no inline event handlers, no `dangerouslySetInnerHTML`.

### CSRF
- Use server actions (Next.js 16 server actions have built-in CSRF protection) for write paths. Avoid raw API routes for state-changing operations.

### Audit
- Git history is the primary audit log (who, when, what changed, via commit metadata).
- DB `lesson_drafts` table preserves draft history (never delete).
- A separate `admin_audit` table logs role changes and user adds/removes:
  ```ts
  adminAudit = sqliteTable("admin_audit", {
    id, actorId, action, targetEmail|targetUserId|targetSlug, beforeJson, afterJson, at
  })
  ```

### Failure modes
- GitHub API rate limit or outage: publish surfaces an error, draft stays unpublished, editor retries. No data loss.
- Race on simultaneous publishes: optimistic commit using GitHub API's `If-Match`. If the file SHA on `main` changed since draft load, return a conflict + diff to the editor.
- Vercel build fail after publish: visible in Vercel's dashboard; previous version still live until next successful build.

## Cost analysis

Per CLAUDE.md rule 8.

| Item | Cost | Notes |
|---|---|---|
| Turso storage for `lessonDrafts`, `allowedUsers`, `adminAudit` | < $0.01/month | Drafts are KB each; even with 100 drafts in flight you're under 1MB. |
| Turso reads/writes | $0 within current plan | Already paying for hosted Turso. |
| GitHub API calls | $0 | Public free tier covers 5,000 authenticated requests/hour. Publishes will use ~3 API calls each. |
| Vercel rebuilds on each publish | $0 within current plan | Watch the Vercel monthly build-minute cap. At one publish per few hours, far below the limit. |
| Octokit npm dependency | $0 | Standard, well-maintained. |
| GitHub App registration (if we go that route over PAT) | $0 | App is a one-time setup. |

Verified current Vercel pricing 2026-05-11 — Hobby plan: 6000 build minutes/month. Pro: unlimited builds. Either way the rebuild costs are negligible.

## Phase breakdown

**Phase 1 — Auth + roles (estimate: 1-2 days)**
- Add `role` to `users`, create `allowedUsers` table, create `adminAudit` table. Drizzle migration.
- Update `auth.ts` sign-in callback to read from `allowedUsers`. Bootstrap from `AUTH_INITIAL_ADMINS`.
- Build `requireRole` helper.
- Build `/admin` layout with role check.
- Build `/admin/users` UI (list, add, change role, remove).
- Deprecate `AUTH_ALLOWED_EMAILS`.

**Phase 2 — Content editor scaffolding (estimate: 1-2 days)**
- `lessonDrafts` table. Drizzle migration.
- `/admin/content` page (list of lessons, with "edit" link).
- `/admin/content/[track]/[slug]` page with bilingual side-by-side prose editor (Alt B model).
- MDX AST parsing + serialization for round-trip safety.
- Autosave to drafts.

**Phase 3 — Publish path (estimate: 1-2 days)**
- GitHub API client (Octokit). PAT in env var for v1; upgrade to GitHub App in a follow-up.
- Publish server action: read draft → validate → commit → stamp `publishedAt`.
- UI feedback: "Published, live in ~1 min" with commit link.
- Conflict handling (file SHA changed since draft load).

**Phase 4 — Preview + polish (estimate: 1 day)**
- Preview route: render draft as a lesson without persisting.
- Audit log views (admin can see who changed what when).
- Empty-state UX for users page and content page.
- Smoke test: edit a lesson in dev, publish to a sandbox branch, confirm it lands.

Total: ~5 working days for one engineer (me) at the bar of "production-ready, security-reviewed, with QA pass per rule 6."

## Open questions

1. **GitHub auth mechanism — PAT or GitHub App?** PAT is faster (5 minutes to set up). GitHub App is more secure (granular permissions, can be installed only on this repo, doesn't tie to a user). Recommend: PAT for v1 to ship, upgrade to App in Phase 5.
2. **Where does the GitHub bot commit from?** Use a dedicated bot account ("flexelent-curriculum-bot") or commit as the editor? Recommend: bot account, with editor name in commit message body and as `Co-Authored-By:` trailer. Cleaner attribution.
3. **Should non-MDX assets (datasets in `content/datasets/`) be editable?** Probably yes eventually. Out of scope for v1.
4. **Should we expose lesson `assignment.ts` files in the editor?** No for v1. Grading logic is code, not prose. Editing it via UI is a stability risk we don't need to take.
5. **Should the editor support inserting / removing whole sections?** Phase 4 question. v1 supports prose edits within existing sections.

## Out of scope (v1)

- Editing `assignment.ts`, dataset files, or any non-MDX content.
- Per-lesson permissions (some users can only edit certain tracks).
- Notifications, emails, Slack pings on publish.
- A real CMS-style media library.
- User self-registration (admins add users one by one).
- Per-user lesson progress dashboards in admin (the `attempts`/`grades` table data is already there; surfacing it is a follow-up).

## Implementation notes for the coding session

- AGENTS.md flags that this repo uses a non-standard Next.js 16. Before writing route handlers or server actions, read `node_modules/next/dist/docs/` for any deprecated APIs.
- Per CLAUDE.md rule 9, consult Context7 for the current Octokit and Auth.js / NextAuth APIs before integrating.
- Per CLAUDE.md rule 6, run an extreme QA pass at the end of each phase, not just the final phase.

## Approval

Approved 2026-05-11 by user.

Decisions on open questions:
1. GitHub auth: **PAT** for v1 (faster ship; can upgrade to GitHub App in a later phase).
2. Commits attributed to **bot account, with editor name in `Co-Authored-By:` trailer**.
