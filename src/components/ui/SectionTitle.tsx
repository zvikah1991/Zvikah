import type { ReactNode } from "react";

/** Shared card heading: a small color-chip accent ahead of a bold title, used across every chart/table card for a consistent, vivid rhythm. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-bold tracking-tight text-[var(--text-primary)]">
      <span
        className="h-4 w-1 shrink-0 rounded-full"
        style={{ background: "linear-gradient(var(--brand), var(--brand-gold))" }}
        aria-hidden="true"
      />
      {children}
    </h3>
  );
}
