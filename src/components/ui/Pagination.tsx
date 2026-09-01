import { formatNumber } from "../../lib/format";
import { IconChevron } from "./Icons";

export function Pagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 p-3 text-sm">
      <span className="text-[var(--text-muted)]">
        עמוד {formatNumber(page + 1)} מתוך {formatNumber(pageCount)}
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page === 0}
          onClick={() => onChange(Math.max(0, page - 1))}
          aria-label="עמוד קודם"
          className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-35"
        >
          <IconChevron className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={page >= pageCount - 1}
          onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
          aria-label="עמוד הבא"
          className="grid h-8 w-8 place-items-center rounded-lg border border-[var(--border)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:pointer-events-none disabled:opacity-35"
        >
          <IconChevron className="h-4 w-4 rotate-180" />
        </button>
      </div>
    </div>
  );
}
