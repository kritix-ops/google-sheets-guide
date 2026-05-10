import { cn } from "@/lib/utils";

export type ProseProps = {
  children: React.ReactNode;
  className?: string;
};

export function Prose({ children, className }: ProseProps) {
  return (
    <div
      className={cn(
        "my-4 max-w-prose text-base leading-relaxed text-foreground/90",
        className,
      )}
    >
      {children}
    </div>
  );
}
