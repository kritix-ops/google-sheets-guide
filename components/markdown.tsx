"use client";

import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { cn } from "@/lib/utils";

const proseComponents: Components = {
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "mt-12 mb-4 text-2xl font-semibold tracking-tight text-foreground first:mt-0",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "mt-8 mb-2 text-xl font-semibold tracking-tight text-foreground",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "mt-6 mb-1 text-lg font-semibold text-foreground",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p className={cn("my-4 text-base text-foreground", className)} {...props} />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn("my-4 ms-4 list-disc space-y-1 marker:text-muted-foreground", className)}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "my-4 ms-4 list-decimal space-y-1 marker:text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
  li: ({ className, ...props }) => (
    <li className={cn("text-base text-foreground", className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      className={cn(
        "text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      target="_blank"
      rel="noreferrer"
      {...props}
    />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn("font-semibold text-foreground", className)} {...props} />
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
        "my-4 overflow-x-auto rounded-sm border bg-surface-elevated p-4 font-mono text-sm leading-6",
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn("my-8 border-border", className)} {...props} />
  ),
  table: ({ className, ...props }) => (
    <div className="my-4 overflow-x-auto">
      <table
        className={cn("w-full border-collapse text-sm", className)}
        {...props}
      />
    </div>
  ),
  thead: ({ className, ...props }) => (
    <thead
      className={cn("border-b bg-surface text-start", className)}
      {...props}
    />
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "px-4 py-2 font-medium text-foreground",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "border-b px-4 py-2 text-foreground",
        className,
      )}
      {...props}
    />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "my-4 border-s-4 border-primary bg-surface-elevated px-4 py-2 italic text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
};

const inlineComponents: Components = {
  p: ({ className, ...props }) => (
    <p className={cn("text-sm text-foreground", className)} {...props} />
  ),
  code: proseComponents.code,
  strong: proseComponents.strong,
  em: proseComponents.em,
  a: proseComponents.a,
};

export function Prose({ children }: { children: string }) {
  return (
    <div className="max-w-prose text-base leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={proseComponents}>
        {children}
      </ReactMarkdown>
    </div>
  );
}

export function InlineMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={inlineComponents}>
      {children}
    </ReactMarkdown>
  );
}
