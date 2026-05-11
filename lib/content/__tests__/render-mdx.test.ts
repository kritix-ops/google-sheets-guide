import { describe, expect, it } from "vitest";

import { renderMdx } from "../render-mdx";

describe("renderMdx", () => {
  it("compiles plain markdown", async () => {
    const result = await renderMdx("# Hello\n\nWorld.");
    expect(result.ok).toBe(true);
  });

  it("rejects an unknown import path", async () => {
    const result = await renderMdx(
      'import { CAMPAIGNS } from "./somewhere-else";\n\n# Hi\n',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/not supported in preview/);
      expect(result.message).toMatch(/ALLOWED_IMPORTS/);
    }
  });

  it("rejects an unknown named export from a known module", async () => {
    const result = await renderMdx(
      'import { NOT_A_REAL_EXPORT } from "@/content/datasets/adtech";\n\n# Hi\n',
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/NOT_A_REAL_EXPORT/);
    }
  });

  it("inlines a known dataset import and compiles", async () => {
    const result = await renderMdx(
      'import { CAMPAIGNS } from "@/content/datasets/adtech";\n\n# Hi\n',
    );
    expect(result.ok).toBe(true);
  });

  it("supports aliased named imports", async () => {
    const result = await renderMdx(
      'import { CAMPAIGNS as Rows } from "@/content/datasets/adtech";\n\n# Hi\n',
    );
    expect(result.ok).toBe(true);
  });

  it("returns a compile error for broken MDX", async () => {
    const result = await renderMdx("# Hi\n\n<Unclosed prop");
    expect(result.ok).toBe(false);
  });

  it("returns the cached result on second call with the same source", async () => {
    const source = "# Same\n\nBody.";
    const first = await renderMdx(source);
    const second = await renderMdx(source);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      // Cache hit returns the exact same Component reference.
      expect(second.Component).toBe(first.Component);
    }
  });
});
