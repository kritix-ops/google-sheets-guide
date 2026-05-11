import "server-only";

import { Buffer } from "node:buffer";

// REST API client for the GitHub Contents endpoints. Used by the admin
// content publisher: GET the current SHA of a lesson file on the target
// branch, then PUT new content with that SHA as the optimistic lock.
//
// Authentication is a PAT in the `GITHUB_PAT` env var. The PAT is the
// commit author; the editor's name + email go in a Co-Authored-By trailer
// in the commit message body (see actions.ts). Three env vars override the
// repo defaults: GITHUB_REPO_OWNER, GITHUB_REPO_NAME, GITHUB_REPO_BRANCH.

const API_BASE = "https://api.github.com";
const API_VERSION = "2022-11-28";

type RepoConfig = {
  owner: string;
  repo: string;
  branch: string;
  token: string;
};

export class PublishConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishConfigError";
  }
}

function loadConfig(): RepoConfig {
  const token = process.env.GITHUB_PAT;
  if (!token) {
    throw new PublishConfigError("GITHUB_PAT env var is not set");
  }
  return {
    owner: process.env.GITHUB_REPO_OWNER ?? "kritix-ops",
    repo: process.env.GITHUB_REPO_NAME ?? "google-sheets-guide",
    branch: process.env.GITHUB_REPO_BRANCH ?? "main",
    token,
  };
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": API_VERSION,
    "User-Agent": "google-sheets-guide-admin",
  };
}

// Each segment of the file path must be encoded so unicode lesson names
// survive intact; the slashes themselves must NOT be encoded.
function encodeRepoPath(repoPath: string): string {
  return repoPath.split("/").map(encodeURIComponent).join("/");
}

async function safeText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

// Returns the blob SHA of the file on the target branch, or null if the
// file does not exist there. Other errors throw.
export async function getCurrentFileSha(
  repoPath: string,
): Promise<string | null> {
  const cfg = loadConfig();
  const url = new URL(
    `/repos/${cfg.owner}/${cfg.repo}/contents/${encodeRepoPath(repoPath)}`,
    API_BASE,
  );
  url.searchParams.set("ref", cfg.branch);
  const res = await fetch(url, {
    headers: authHeaders(cfg.token),
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await safeText(res);
    throw new Error(`GitHub get-contents ${res.status}: ${body}`);
  }
  const json = (await res.json()) as { sha?: string; type?: string };
  if (json.type && json.type !== "file") {
    throw new Error(
      `GitHub get-contents returned non-file type "${json.type}" for ${repoPath}`,
    );
  }
  if (!json.sha) {
    throw new Error("GitHub get-contents response missing sha");
  }
  return json.sha;
}

export type PublishResult =
  | {
      ok: true;
      commitSha: string;
      commitUrl: string;
      newFileSha: string;
    }
  | { ok: false; reason: "conflict"; currentSha: string | null }
  | { ok: false; reason: "github_error"; status: number; message: string }
  | { ok: false; reason: "config_error"; message: string };

// Optimistic write: verifies the file's current SHA matches what the
// caller expected (i.e. nothing has been published upstream since the
// editor opened the page), then PUTs the new content. On 409/422 from the
// PUT itself (millisecond-window race), returns `conflict` with the
// freshly-fetched current SHA.
export async function publishFile(args: {
  repoPath: string;
  content: string;
  expectedBaseSha: string | null;
  commitMessage: string;
}): Promise<PublishResult> {
  let cfg: RepoConfig;
  try {
    cfg = loadConfig();
  } catch (err) {
    return { ok: false, reason: "config_error", message: (err as Error).message };
  }

  let currentSha: string | null;
  try {
    currentSha = await getCurrentFileSha(args.repoPath);
  } catch (err) {
    return {
      ok: false,
      reason: "github_error",
      status: 0,
      message: (err as Error).message,
    };
  }

  if (currentSha !== args.expectedBaseSha) {
    return { ok: false, reason: "conflict", currentSha };
  }

  // expectedBaseSha === null means "the editor saw a missing file". Per
  // v1 scope (plan §"Bilingual UX"), we never publish a brand-new file
  // from the editor, only updates. Refuse explicitly.
  if (currentSha === null) {
    return { ok: false, reason: "conflict", currentSha: null };
  }

  const url = new URL(
    `/repos/${cfg.owner}/${cfg.repo}/contents/${encodeRepoPath(args.repoPath)}`,
    API_BASE,
  );

  const res = await fetch(url, {
    method: "PUT",
    headers: { ...authHeaders(cfg.token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message: args.commitMessage,
      content: Buffer.from(args.content, "utf-8").toString("base64"),
      sha: currentSha,
      branch: cfg.branch,
    }),
    cache: "no-store",
  });

  // GitHub returns 409 when the SHA we sent no longer matches HEAD on the
  // branch. 422 covers the related case where the file moved or branch
  // protection blocked the write.
  if (res.status === 409 || res.status === 422) {
    const fresh = await getCurrentFileSha(args.repoPath).catch(() => null);
    return { ok: false, reason: "conflict", currentSha: fresh };
  }

  if (!res.ok) {
    const message = await safeText(res);
    return {
      ok: false,
      reason: "github_error",
      status: res.status,
      message: message.slice(0, 1000),
    };
  }

  const json = (await res.json()) as {
    content?: { sha?: string };
    commit?: { sha?: string; html_url?: string };
  };
  const newFileSha = json.content?.sha;
  const commitSha = json.commit?.sha;
  const commitUrl = json.commit?.html_url;
  if (!newFileSha || !commitSha || !commitUrl) {
    return {
      ok: false,
      reason: "github_error",
      status: res.status,
      message: "GitHub PUT response missing expected fields",
    };
  }

  return { ok: true, commitSha, commitUrl, newFileSha };
}
