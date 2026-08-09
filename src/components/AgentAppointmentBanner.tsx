import { useMemo } from "react";
import type { SalesRecord } from "../types";
import { formatCurrency, formatNumber } from "../lib/format";
import { IconBriefcase } from "./ui/Icons";

export function AgentAppointmentBanner({ records }: { records: SalesRecord[] }) {
  const { count, premium } = useMemo(
    () => ({
      count: records.length,
      premium: records.reduce((sum, r) => sum + (r.expectedPremium ?? 0), 0),
    }),
    [records],
  );

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)]/60 px-4 py-2.5 text-sm">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--surface)] text-[var(--text-muted)]">
        <IconBriefcase className="h-3.5 w-3.5" />
      </span>
      <span className="font-medium">מינוי סוכן</span>
      <span className="text-[var(--text-muted)]">— בשורה נפרדת, לא נכלל בסה״כ הפרמיה הראשי</span>
      <span className="ms-auto flex items-center gap-4 tabular-nums">
        <span>
          <span className="text-[var(--text-muted)]">עסקאות: </span>
          <span className="font-medium">{formatNumber(count)}</span>
        </span>
        <span>
          <span className="text-[var(--text-muted)]">פרמיה: </span>
          <span className="font-medium">{formatCurrency(premium)}</span>
        </span>
      </span>
    </div>
  );
}
