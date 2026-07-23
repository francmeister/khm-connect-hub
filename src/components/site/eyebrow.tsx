import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({
  children,
  className,
  tone = "muted",
}: {
  children: ReactNode;
  className?: string;
  tone?: "muted" | "brand";
}) {
  return (
    <div
      className={cn(
        "font-mono uppercase tracking-[0.16em] text-[11px]",
        tone === "brand" ? "text-[var(--brand)]" : "text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}
