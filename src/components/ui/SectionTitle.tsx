import type { ReactNode } from "react";

/** Shared card heading: bold title with a small brand accent bar, used across every chart/table card for a consistent rhythm. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
      <span className="h-3.5 w-1 shrink-0 rounded-full bg-[var(--brand)]" aria-hidden="true" />
      {children}
    </h3>
  );
}
