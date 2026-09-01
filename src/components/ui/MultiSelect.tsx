import { useEffect, useRef, useState } from "react";
import clsx from "clsx";

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors",
          selected.length > 0
            ? "border-[var(--brand)]/40 bg-[color-mix(in_oklab,var(--brand)_5%,var(--surface))] hover:bg-[color-mix(in_oklab,var(--brand)_9%,var(--surface))]"
            : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-2)]",
        )}
      >
        <span className="text-[var(--text-secondary)]">{label}</span>
        {selected.length > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[var(--brand)] px-1 text-xs font-semibold text-white tabular-nums">
            {selected.length}
          </span>
        )}
        <svg width="12" height="12" viewBox="0 0 12 12" className={clsx("text-[var(--text-muted)] transition-transform", open && "rotate-180")}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          className="animate-fade-up absolute z-20 mt-1.5 max-h-72 w-56 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] p-1.5 scrollbar-thin"
          style={{ boxShadow: "var(--shadow-lg)", animationDuration: "0.15s" }}
        >
          {options.length === 0 && <div className="px-2 py-1.5 text-sm text-[var(--text-muted)]">אין אפשרויות</div>}
          {options.map((opt) => {
            const checked = selected.includes(opt);
            return (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-[var(--surface-2)]"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(opt)}
                  className="h-3.5 w-3.5 accent-[var(--brand)]"
                />
                <span className="truncate">{opt}</span>
              </label>
            );
          })}
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="mt-1 w-full rounded-lg px-2 py-1.5 text-start text-xs text-[var(--status-critical)] hover:bg-[var(--surface-2)]"
            >
              נקה בחירה
            </button>
          )}
        </div>
      )}
    </div>
  );
}
