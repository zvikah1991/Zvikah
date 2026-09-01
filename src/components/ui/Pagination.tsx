import { formatNumber } from "../../lib/format";
import { IconChevron } from "./Icons";
import { Button } from "./Button";

export function Pagination({ page, pageCount, onChange }: { page: number; pageCount: number; onChange: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-2 p-3 text-sm">
      <span className="text-[var(--text-muted)]">
        עמוד {formatNumber(page + 1)} מתוך {formatNumber(pageCount)}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="secondary"
          size="icon"
          disabled={page === 0}
          onClick={() => onChange(Math.max(0, page - 1))}
          aria-label="עמוד קודם"
        >
          <IconChevron className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          disabled={page >= pageCount - 1}
          onClick={() => onChange(Math.min(pageCount - 1, page + 1))}
          aria-label="עמוד הבא"
        >
          <IconChevron className="h-4 w-4 rotate-180" />
        </Button>
      </div>
    </div>
  );
}
