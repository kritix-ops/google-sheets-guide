# FunctionRef pedagogy: introduce every function properly

2026-05-11

## Goals

Raise the pedagogy bar across the curriculum so no Sheets function is ever
introduced in a lesson without the learner being told (a) what it does in
one sentence, (b) its exact syntax, (c) the meaning, type, and default of
every parameter, and (d) what it returns. Today Lesson 1.2 introduces
`ARRAYFORMULA` and `XLOOKUP` with neither a definition nor a parameter
table; the same gap recurs across many lessons.

## Constraints (locked 2026-05-11)

- Pedagogy shape: a registry-backed `<FunctionRef>` MDX component renders
  the canonical block. Inline prose around it is allowed (and encouraged
  where the author has a specific angle) but the structure block is
  always present at first-introduction.
- One source of truth for every function spec, so a fix to a parameter
  description in the registry propagates everywhere.
- All specs verified against the official Google Sheets help pages.
  Curriculum source URLs are in CLAUDE.md.
- Bilingual: descriptions and parameter meanings exist in both EN and HE.
  Syntax and parameter *names* stay in English; the prose around them is
  translated.
- Must not break the existing search index extractor (lesson body still
  searchable; FunctionRef contents must be indexed too).

## Architecture

### `content/functions/registry.ts`

A typed registry of function specs. Each entry:

```ts
type FunctionSpec = {
  name: string;                    // canonical, uppercase
  category: "lookup" | "array" | "logical" | ...;
  summary: { en: string; he: string };  // one sentence
  syntax: string;                  // exact official form
  params: Array<{
    name: string;
    type: string;                  // "range" | "string" | "number" | "expression" | "boolean"
    optional?: boolean;
    default?: string;              // shown when optional
    accepts?: string[];            // enumerated values, e.g. ["0", "1", "-1", "2"]
    description: { en: string; he: string };
  }>;
  returns: { en: string; he: string };
  docsUrl: string;                 // Google's canonical help page
};
```

Initial population for the Lesson 1.2 fix: `ARRAYFORMULA`, `XLOOKUP`,
`QUERY`. Registry grows as the audit/fix agent encounters each new
function across the curriculum.

### `<FunctionRef name="..." />` MDX component

Server component that:
1. Looks up the spec from the registry by name.
2. Reads the active locale via `useLocale()`.
3. Renders a glanceable card:
   - Function name (mono, large)
   - One-sentence summary (locale-appropriate)
   - Syntax in a code box
   - Parameter table: name / type / required-or-default / meaning. Optional
     params are visually distinct.
   - "Returns" line
   - Subtle link to Google's official docs page

If the registry lacks the name, the component renders a visible warning
(in dev only) and a placeholder so build doesn't break.

### MDX components wiring

Register `<FunctionRef>` in `mdx-components.tsx` alongside `<MiniGrid>`,
`<RefDemo>`, etc. The search-index extractor (`lib/search/extract-lesson.ts`)
already drops JSX components from prose; that's fine because the registry
content itself is searchable independently (future enhancement; not in v1).

### Lesson 1.2 fix

Add `<FunctionRef name="ARRAYFORMULA" />` directly above the "Arrays:
explicit, not implicit" section's first `<TryIt>`. Add
`<FunctionRef name="XLOOKUP" />` above the XLOOKUP `<TryIt>`. Add
`<FunctionRef name="QUERY" />` next to the QUERY row of the Power Query
mapping table (or directly above the QUERY `<QuickCheck>`).

Keep the existing adtech-flavored prose. The FunctionRef block provides
the canonical "what is this" answer; the prose then connects it to the
team's workflow. Both signals layer.

## Audit + fix agent

After Lesson 1.2 is pushed:

Phase 1 (audit, one agent per track): the agent reads every lesson MDX
in its track in EN, identifies the functions taught or first-used, cross-
references the registry, and produces a structured report:
- which lessons are missing FunctionRef for which functions
- which functions need new registry entries
- duplicates / over-introductions (the same function appearing as "new"
  in multiple lessons)

Phase 2 (apply): with the punch list in hand, the agent extends the
registry for any new functions (verifying each new spec via WebFetch
to the official Google docs page), then inserts `<FunctionRef>` blocks
at the right anchor in each EN + HE lesson. Commits per track, runs
the search-index build, and reports.

Why per-track agents: 80 lessons × 2 languages is too much context for
one agent. Tracks are 14-28 lessons each. Each agent's prompt includes
the exact component contract, the spec verification source URL pattern,
and the commit message template.

## Security (per CLAUDE.md rule 13)

- FunctionRef renders only registry data; no user content. No XSS surface.
- Registry entries are author-curated, never user-provided.
- Agent commits are reviewable per-track before merge.

## Cost (per CLAUDE.md rule 8)

- No paid services. No new runtime deps. Tiny build-time cost (an
  extra ~10 KB per locale in the search index, optional).
- LLM agent cost: per-track audit-and-fix passes; estimate one prompt
  per track on Opus 4.7 (~$0.30 per agent invocation at current
  pricing, verify before running per the rule).

## Approval

Approved 2026-05-11 by user (option 3: component + inline prose).
