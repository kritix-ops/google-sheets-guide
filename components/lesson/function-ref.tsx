import { ExternalLink } from "lucide-react";
import { getLocale } from "next-intl/server";

import {
  getFunctionSpec,
  localized,
  type FunctionSpec,
} from "@/content/functions/registry";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

type Props = {
  // The function's canonical name as it appears in the registry, uppercase.
  // Example: <FunctionRef name="XLOOKUP" />.
  name: string;
  className?: string;
};

// Renders a glanceable spec block for a Sheets function: one-line
// summary, exact syntax, full parameter table with type + default +
// meaning, returns line, and a link to Google's official docs. The
// spec comes from content/functions/registry.ts and is never re-typed inline
// in a lesson. Lessons can layer prose around this block to add their
// own angle (when to reach for it, gotchas, real-world wiring).
export async function FunctionRef({ name, className }: Props) {
  const locale = (await getLocale()) as Locale;
  const spec = getFunctionSpec(name);

  if (!spec) {
    return (
      <div
        className={cn(
          "not-prose my-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive",
          className,
        )}
      >
        <code className="font-mono font-semibold">{name}</code> is not
        registered. Add it to <code>content/functions/registry.ts</code>.
      </div>
    );
  }

  return (
    <section
      className={cn(
        "not-prose my-6 overflow-hidden rounded-lg border bg-card shadow-1",
        className,
      )}
    >
      <header className="flex items-baseline justify-between gap-4 border-b bg-muted/30 px-5 py-3">
        <div className="flex items-baseline gap-3">
          <code className="font-mono text-base font-semibold tracking-tight text-foreground">
            {spec.name}
          </code>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {spec.category}
          </span>
        </div>
        <a
          href={spec.docsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          docs
          <ExternalLink className="h-3 w-3" />
        </a>
      </header>

      <div className="space-y-4 px-5 py-4">
        <p className="text-sm leading-relaxed text-foreground/90">
          {localized(spec.summary, locale)}
        </p>

        <SyntaxBlock syntax={spec.syntax} />

        <ParamTable spec={spec} locale={locale} />

        <ReturnsLine text={localized(spec.returns, locale)} />
      </div>
    </section>
  );
}

function SyntaxBlock({ syntax }: { syntax: string }) {
  return (
    <pre className="overflow-x-auto rounded-md border bg-surface-elevated px-3 py-2 font-mono text-xs leading-relaxed text-foreground">
      <code>={syntax}</code>
    </pre>
  );
}

function ParamTable({
  spec,
  locale,
}: {
  spec: FunctionSpec;
  locale: Locale;
}) {
  return (
    <div className="overflow-hidden rounded-md border">
      <table className="w-full text-xs">
        <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-start font-medium">
              {locale === "he" ? "פרמטר" : "Parameter"}
            </th>
            <th className="px-3 py-2 text-start font-medium">
              {locale === "he" ? "טיפוס" : "Type"}
            </th>
            <th className="px-3 py-2 text-start font-medium">
              {locale === "he" ? "חובה / ברירת מחדל" : "Required / default"}
            </th>
            <th className="px-3 py-2 text-start font-medium">
              {locale === "he" ? "משמעות" : "Meaning"}
            </th>
          </tr>
        </thead>
        <tbody>
          {spec.params.map((p) => (
            <tr key={p.name} className="border-t align-top">
              <td className="px-3 py-2 font-mono text-foreground">{p.name}</td>
              <td className="px-3 py-2 font-mono text-muted-foreground">
                {p.type}
              </td>
              <td className="px-3 py-2 text-muted-foreground">
                {p.optional ? (
                  <span>
                    {locale === "he" ? "אופציונלי" : "optional"}
                    {p.default ? (
                      <>
                        {" "}
                        <span className="rounded-sm bg-muted px-1 font-mono text-[10px] text-foreground">
                          {p.default}
                        </span>
                      </>
                    ) : null}
                  </span>
                ) : (
                  <span className="font-medium text-foreground">
                    {locale === "he" ? "חובה" : "required"}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 leading-relaxed text-foreground/90">
                {localized(p.description, locale)}
                {p.accepts && p.accepts.length > 0 ? (
                  <AcceptsList accepts={p.accepts} locale={locale} />
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AcceptsList({
  accepts,
  locale,
}: {
  accepts: NonNullable<FunctionSpec["params"][number]["accepts"]>;
  locale: Locale;
}) {
  return (
    <ul className="mt-2 space-y-1 text-[11px] leading-snug">
      {accepts.map((a) => (
        <li key={a.value} className="flex gap-2">
          <code className="shrink-0 rounded-sm bg-muted px-1 font-mono text-foreground">
            {a.value}
          </code>
          <span className="text-foreground/80">
            {localized(a.description, locale)}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ReturnsLine({ text }: { text: string }) {
  return (
    <div className="rounded-md border-l-2 border-primary/50 bg-surface-elevated/40 px-3 py-2 text-xs leading-relaxed text-foreground/90">
      <span className="font-semibold text-foreground">Returns: </span>
      {text}
    </div>
  );
}
