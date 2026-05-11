import "server-only";

import { createHash } from "node:crypto";

import { evaluate } from "@mdx-js/mdx";
import type { ComponentType } from "react";
import * as runtime from "react/jsx-runtime";

import * as adtech from "@/content/datasets/adtech";
import { useMDXComponents } from "@/mdx-components";

// MDX lessons in this repo all start with a top-level import of named
// data exports from `@/content/datasets/adtech`. At build time, Webpack
// resolves that alias; at runtime, `evaluate` cannot resolve `@/` and
// would throw on the first import statement.
//
// We pre-substitute the known dataset module by rewriting the import
// statement into in-source `export const NAME = <json>;` declarations
// before passing the source to `evaluate`. Anything imported from an
// unrecognized path is rejected explicitly, so editors who add a new
// import in a draft see a clear error in preview rather than a cryptic
// compile failure.
//
// Adding a new dataset module: import it here and extend ALLOWED_IMPORTS
// with one entry. The map is the single registration point.

type ImportableModule = Record<string, unknown>;

const ALLOWED_IMPORTS: Record<string, ImportableModule> = {
  "@/content/datasets/adtech": adtech as unknown as ImportableModule,
};

// Single top-level `import { A, B as C } from "..."` statement. The match
// is anchored at the start of a line and requires a closing `}` on the
// same line, mirroring the existing curriculum's import shape. Default
// and namespace imports are intentionally not matched: they fall through
// and surface as evaluate errors.
const IMPORT_RE = /^[ \t]*import\s*\{([^}]+)\}\s*from\s*["']([^"']+)["'];?[ \t]*$/gm;

// `Name` or `Name as Alias`. Trailing/leading whitespace already trimmed
// by the splitter above. The captured groups give us original + local.
const SPEC_RE = /^([A-Za-z_$][A-Za-z0-9_$]*)(?:\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*))?$/;

type ImportRewriteResult =
  | { ok: true; source: string }
  | { ok: false; message: string };

function rewriteImports(source: string): ImportRewriteResult {
  let failure: string | null = null;

  const rewritten = source.replace(IMPORT_RE, (match, namesRaw, fromPath) => {
    if (failure) return match;
    const mod = ALLOWED_IMPORTS[fromPath as string];
    if (!mod) {
      const known = Object.keys(ALLOWED_IMPORTS).join(", ");
      failure = `Import from "${fromPath}" is not supported in preview. Allowed modules: ${known}. To add a new module, register it in ALLOWED_IMPORTS in lib/content/render-mdx.ts.`;
      return match;
    }
    const specs = String(namesRaw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (specs.length === 0) {
      failure = `Empty import list from "${fromPath}".`;
      return match;
    }
    const out: string[] = [];
    for (const spec of specs) {
      const m = SPEC_RE.exec(spec);
      if (!m) {
        failure = `Could not parse import specifier "${spec}" (from "${fromPath}").`;
        return match;
      }
      const original = m[1];
      const local = m[2] ?? m[1];
      const value = mod[original];
      if (value === undefined) {
        failure = `Symbol "${original}" was not found in ${fromPath}.`;
        return match;
      }
      let literal: string | undefined;
      try {
        literal = JSON.stringify(value);
      } catch (err) {
        failure = `Failed to inline "${original}": ${(err as Error).message}`;
        return match;
      }
      if (literal === undefined) {
        failure = `Symbol "${original}" in ${fromPath} is not JSON-serializable.`;
        return match;
      }
      out.push(`export const ${local} = ${literal};`);
    }
    return out.join("\n");
  });

  if (failure) return { ok: false, message: failure };
  return { ok: true, source: rewritten };
}

export type RenderResult =
  | { ok: true; Component: ComponentType }
  | { ok: false; message: string };

// Bounded in-memory cache so a quick reload of the preview tab doesn't
// re-compile the same source. Keyed by SHA-256 of the input string so any
// edit yields a fresh entry. Eviction is FIFO via Map's insertion order;
// 50 entries is enough for an editor proofreading a few lessons in a
// session and bounds memory to a few hundred KB.
const CACHE_LIMIT = 50;
const cache = new Map<string, RenderResult>();

function cacheKey(source: string): string {
  return createHash("sha256").update(source).digest("hex");
}

function cachePut(key: string, value: RenderResult): void {
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

// Compile and evaluate an MDX string into a React component. The
// component renders the lesson with our standard MDX components from
// `mdx-components.tsx` (MiniGrid, RefDemo, Prose, etc.) so a draft
// preview matches the live experience as closely as possible.
export async function renderMdx(source: string): Promise<RenderResult> {
  const key = cacheKey(source);
  const cached = cache.get(key);
  if (cached) return cached;

  const prep = rewriteImports(source);
  if (!prep.ok) {
    const result: RenderResult = { ok: false, message: prep.message };
    cachePut(key, result);
    return result;
  }

  let result: RenderResult;
  try {
    const r = runtime as unknown as {
      Fragment: unknown;
      jsx: unknown;
      jsxs: unknown;
    };
    const evaluated = await evaluate(prep.source, {
      Fragment: r.Fragment as never,
      jsx: r.jsx as never,
      jsxs: r.jsxs as never,
      useMDXComponents: () => useMDXComponents({}),
    });
    result = { ok: true, Component: evaluated.default as ComponentType };
  } catch (err) {
    const e = err as { message?: string; line?: number; column?: number };
    const where =
      typeof e.line === "number" && typeof e.column === "number"
        ? ` (line ${e.line}, col ${e.column})`
        : "";
    result = {
      ok: false,
      message: `${e.message ?? "MDX evaluate failed"}${where}`,
    };
  }

  cachePut(key, result);
  return result;
}
