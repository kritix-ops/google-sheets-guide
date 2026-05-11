# Admin smoke test (Phases 3 + 4), 2026-05-11

End-to-end manual checks for the admin content editor, publish pipeline,
preview route, and audit log. Run this once locally against a sandbox
branch before exercising publishing on `main`.

## Setup

Env vars required for publish testing:

- `GITHUB_PAT`: fine-grained PAT with `Contents: Read and write` on the
  target repo. Keep it short-lived for testing.
- `GITHUB_REPO_BRANCH=sandbox-admin-publish`: point at a throwaway branch
  for the smoke run. Create the branch in GitHub first; it must already
  contain the `content/{en,he}/lessons/...` files for any lesson you plan
  to edit.
- `GITHUB_REPO_OWNER`, `GITHUB_REPO_NAME`: defaults are
  `kritix-ops/google-sheets-guide`; override if testing in a fork.

Auth + role requirements:

- Signed-in user with role `editor` (publish + preview) or `admin`
  (everything, including users + audit). Bootstrap via
  `AUTH_INITIAL_ADMINS` if the `allowed_user` table is empty.

Start the dev server: `npm run dev`.

## Scenarios

### S1: Happy-path publish (sandbox branch)

1. Sign in. Visit `/admin/content`.
2. Pick a lesson that has both `EN` and `HE` files. Click `Edit`.
3. In the EN textarea, change one prose line (avoid editing JSX tags).
4. Click `Save draft`. Status flips to `Draft saved: <timestamp>`.
5. Click `Preview`. New tab opens; warning banner at top, rendered
   lesson body matches your change.
6. Back in the editor, click `Publish`.
7. Banner shows `Published. Live in about a minute once Vercel rebuilds.`
   plus a `View commit (abcdef0)` link.
8. Open the commit on GitHub. Confirm:
   - The diff matches your edit.
   - Commit author is the GitHub user that owns the PAT.
   - Commit body includes `Co-Authored-By: <your-name> <your-email>`.
9. (Optional) Wait for the Vercel preview build on the sandbox branch and
   load the lesson at the preview URL. Confirm the change is live.

### S2: Conflict detection

1. As editor A, open lesson X. Save (don't publish) a draft.
2. From a second context (another browser, or `git commit && git push`
   directly to the sandbox branch), modify lesson X's MDX upstream.
3. As editor A, click `Publish`. Expected banner:
   `Someone else published since you opened this page. Your draft is
   safe. Reload to pull in the new base...`
4. Reload. Confirm the draft text is still in the textarea and the
   `Draft saved` timestamp is unchanged.

### S3: MDX compile error

1. Open the editor. In a draft, insert a broken tag like
   `<MiniGrid data={[` (no closing).
2. `Save draft` → succeeds. `Publish` → banner:
   `Your MDX does not compile.` with the compile error message and a
   line/col indicator.
3. The lesson on `main` (or sandbox) is untouched.

### S4: Missing or invalid PAT

1. Unset `GITHUB_PAT`. Restart the dev server.
2. Open any lesson editor. Each pane shows a banner:
   `Publishing is offline: the server has no GitHub token configured.`
3. Publish button is disabled. Save and Discard still work.
4. Re-set the PAT to an invalid value. Banner should change to
   `Publishing is offline: cannot reach GitHub right now.` (the page-load
   fetch fails as a 401, surfaced as `github_error`).

### S5: Preview empty state

1. Open `/admin/content/formulas/01-grid-model` on an editor that has no
   draft for either language.
2. Preview button on each pane is disabled with the tooltip
   `Save your draft first; preview renders the saved version.`
3. Open `/admin/content/formulas/01-grid-model/preview?lang=en`
   directly. Confirm the empty-state box appears.

### S6: Preview unsupported import

1. Save a draft whose first line is
   `import { Anything } from "./not-a-known-module";`.
2. Click Preview. Expected RenderError box:
   `Import from "./not-a-known-module" is not allowed in preview...`.
3. No crash; commit nothing.

### S7: Audit log (admin only)

1. As admin, visit `/admin/audit`. Confirm rows in newest-first order for
   recent `user.add`, `user.role_change`, `content.publish` actions.
2. Select the `content.publish` filter. URL becomes
   `?action=content.publish`. Page resets to 1.
3. On a `content.publish` row, click the rendered commit URL. The
   linked GitHub commit page opens.
4. If you have more than 50 audit rows, confirm `Next` link advances to
   `?page=2`.
5. As an editor (non-admin), navigate to `/admin/audit`. You should be
   redirected (`?forbidden=1`).

### S8: Hebrew (RTL) round-trip

1. Edit the Hebrew pane of any bilingual lesson. Add Hebrew text.
2. Save, preview, publish. Confirm:
   - Preview renders RTL with the new Hebrew text intact.
   - The committed file on GitHub contains the same UTF-8 Hebrew bytes.

### S9: Two-tab same editor

1. Open the same lesson in two browser tabs as the same editor.
2. In tab A, edit and publish. Confirm success.
3. In tab B (still showing the pre-publish baseSha), edit and click
   Publish. Expected: conflict banner. Reload tab B; baseSha is now
   fresh; publishing now works.

## Pass criteria

All nine scenarios behave as described. Any deviation is a bug; file it
against this plan before promoting from sandbox to `main`.
