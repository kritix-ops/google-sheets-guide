import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";

import {
  Compare,
  ComparePanel,
  FunctionRef,
  MiniGrid,
  QuickCheck,
  RefDemo,
  StepThrough,
  TryIt,
} from "@/components/lesson";
import { slugify } from "@/lib/search/slugify";
import { cn } from "@/lib/utils";

// Recursively extract plain text from MDX heading children. Headings may
// contain inline formatting (`## A **bold** word`), which arrives as a
// mixed array of strings and React elements. We need the flat text to
// compute a deterministic anchor ID that matches the search index.
function nodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(nodeText).join("");
  }
  if (typeof node === "object" && "props" in node) {
    const children = (node as { props?: { children?: ReactNode } }).props
      ?.children;
    return children ? nodeText(children) : "";
  }
  return "";
}

function headingId(children: ReactNode): string {
  const text = nodeText(children).trim();
  return text.length > 0 ? slugify(text) : "";
}

const lessonComponents: MDXComponents = {
  Compare,
  ComparePanel,
  FunctionRef,
  MiniGrid,
  QuickCheck,
  RefDemo,
  StepThrough,
  TryIt,
};

const proseComponents: MDXComponents = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mb-4 mt-10 text-2xl font-semibold tracking-tight text-foreground first:mt-0",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, id, children, ...props }) => (
    <h2
      id={id ?? (headingId(children) || undefined)}
      className={cn(
        "scroll-mt-24 mb-3 mt-10 text-xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ className, id, children, ...props }) => (
    <h3
      id={id ?? (headingId(children) || undefined)}
      className={cn(
        "scroll-mt-24 mb-2 mt-6 text-lg font-semibold text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn(
        "my-4 max-w-prose text-base leading-relaxed text-foreground/90",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "my-4 ml-5 list-disc space-y-1 text-foreground/90 marker:text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "my-4 ml-5 list-decimal space-y-1 text-foreground/90 marker:text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("text-foreground/90", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  ),
  strong: ({ className, ...props }) => (
    <strong
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  ),
  em: ({ className, ...props }) => (
    <em className={cn("italic", className)} {...props} />
  ),
  code: ({ className, ...props }) => (
    <code
      className={cn(
        "rounded-sm bg-surface-elevated px-1.5 py-0.5 font-mono text-[0.875em] text-foreground",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "my-4 overflow-x-auto rounded-md border bg-surface-elevated p-4 font-mono text-sm leading-6",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-8 border-border", className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-4 border-l-2 border-primary bg-surface-elevated/50 px-4 py-2 italic text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
};

export function useMDXComponents(
  components: MDXComponents = {},
): MDXComponents {
  return { ...proseComponents, ...lessonComponents, ...components };
}
