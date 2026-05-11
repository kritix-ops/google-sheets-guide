import "server-only";

import { compile } from "@mdx-js/mdx";

// Server-side sanity check: does the proposed MDX even compile? Catches
// the broad class of editor mistakes such as unclosed JSX tags, malformed
// frontmatter, and stray `{` in prose. Does not verify that referenced
// components are actually exported by `mdx-components.tsx`; that would
// require a render, which is overkill for v1.

export type MdxValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export async function validateMdx(content: string): Promise<MdxValidationResult> {
  try {
    await compile(content, { format: "mdx" });
    return { ok: true };
  } catch (err) {
    const e = err as { message?: string; line?: number; column?: number };
    const where =
      typeof e.line === "number" && typeof e.column === "number"
        ? ` (line ${e.line}, col ${e.column})`
        : "";
    return {
      ok: false,
      message: `${e.message ?? "MDX compile failed"}${where}`,
    };
  }
}
