import { slugify } from "./slugify";
import type { LessonIndexEntry } from "./types";
import type { LessonLang } from "@/lib/db/schema";

// Strip MDX-isms from a lesson source so we're left with plain prose that
// can be indexed for search. The lessons in this repo follow a narrow
// shape, so a regex-based stripper is more than enough and keeps the
// indexer free of the heavy unified pipeline at build time.
//
// What we strip:
// - Top-level `import ... from "..."` lines.
// - Fenced code blocks (```...```).
// - Inline code spans (`code`).
// - JSX element blocks, including multi-line ones with prop expressions.
//
// What survives:
// - Markdown text, headings, lists, emphasis, links (we keep link text).
function stripMdx(source: string): string {
  let s = source;

  // Drop top-level import statements (anchored to BOL by the m flag).
  s = s.replace(/^[ \t]*import\s+[^\n;]+;?[ \t]*$/gm, "");

  // Drop fenced code blocks. Match across lines, non-greedy.
  s = s.replace(/```[\s\S]*?```/g, " ");

  // Drop inline code.
  s = s.replace(/`[^`\n]*`/g, " ");

  // Drop self-closing JSX elements: <Foo ... />. Non-greedy so it
  // doesn't gobble across multiple elements.
  s = s.replace(/<[A-Z][\w.]*[\s\S]*?\/>/g, " ");

  // Drop paired JSX elements: <Foo ...>...</Foo>. Component names start
  // with an uppercase letter; standard HTML tags (lowercase) are left
  // alone so their text content survives.
  s = s.replace(/<([A-Z][\w.]*)[\s\S]*?<\/\1>/g, " ");

  // Collapse stray markdown link syntax into the link text.
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Tidy whitespace.
  s = s.replace(/\r\n/g, "\n");
  return s;
}

type Section = { headingLevel: 2 | 3 | null; heading: string; body: string };

// Walk the stripped source line by line, partitioning it into sections.
// Each H2 starts a new section; H3 deepens an existing section's heading
// but still creates a search-addressable target with its own ID. Lines
// before the first heading become the lesson's intro section.
function partition(stripped: string): {
  title: string;
  intro: string;
  sections: Section[];
} {
  const lines = stripped.split("\n");
  let title = "";
  let intro = "";
  const sections: Section[] = [];

  let current: Section | null = null;

  function commit() {
    if (current) {
      current.body = current.body.replace(/\s+/g, " ").trim();
      sections.push(current);
      current = null;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const h1 = /^#\s+(.+)$/.exec(line);
    const h2 = /^##\s+(.+)$/.exec(line);
    const h3 = /^###\s+(.+)$/.exec(line);

    if (h1) {
      if (!title) title = h1[1].trim();
      continue;
    }
    if (h2) {
      commit();
      current = { headingLevel: 2, heading: h2[1].trim(), body: "" };
      continue;
    }
    if (h3) {
      commit();
      current = { headingLevel: 3, heading: h3[1].trim(), body: "" };
      continue;
    }

    // Skip the rest of the markdown heading levels (####+); their text
    // still lands in the parent section's body via the bare-line path
    // below if we don't catch it. Catch and treat as plain text.
    const deepHeading = /^#{4,6}\s+(.+)$/.exec(line);
    const textLine = deepHeading ? deepHeading[1] : line;

    if (current) {
      current.body += `${textLine}\n`;
    } else {
      intro += `${textLine}\n`;
    }
  }
  commit();

  return {
    title,
    intro: intro.replace(/\s+/g, " ").trim(),
    sections,
  };
}

// Strip markdown emphasis markers so the searchable body is plain text.
// Done after partition so heading detection has the original `#`s intact.
function flattenMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractLessonEntries(args: {
  source: string;
  lang: LessonLang;
  track: string;
  trackLabel: string;
  slug: string;
  assignmentId: string;
  order: number;
  fallbackTitle: string;
}): LessonIndexEntry[] {
  const stripped = stripMdx(args.source);
  const { title: parsedTitle, intro, sections } = partition(stripped);
  const title = parsedTitle || args.fallbackTitle;

  const baseHref = `/lesson/${args.assignmentId}`;
  const baseId = `${args.lang}:${args.track}/${args.slug}`;

  // One lesson-level entry that aggregates everything for "any prose"
  // hits, plus one entry per heading for deep-link results.
  const aggregatedBody = flattenMarkdown(
    [intro, ...sections.map((s) => `${s.heading} ${s.body}`)].join("\n"),
  );

  const entries: LessonIndexEntry[] = [
    {
      id: baseId,
      kind: "lesson",
      lang: args.lang,
      track: args.track,
      trackLabel: args.trackLabel,
      slug: args.slug,
      order: args.order,
      assignmentId: args.assignmentId,
      title,
      body: aggregatedBody,
      href: baseHref,
    },
  ];

  for (const section of sections) {
    const headingId = slugify(section.heading);
    if (!headingId) continue;
    entries.push({
      id: `${baseId}#${headingId}`,
      kind: "heading",
      lang: args.lang,
      track: args.track,
      trackLabel: args.trackLabel,
      slug: args.slug,
      order: args.order,
      assignmentId: args.assignmentId,
      title,
      heading: section.heading,
      headingId,
      body: flattenMarkdown(section.body),
      href: `${baseHref}#${headingId}`,
    });
  }

  return entries;
}
