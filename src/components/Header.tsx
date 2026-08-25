import { useRef } from "react";
import type { DataMeta } from "../types";
import { relativeUpdatedAt } from "../lib/format";
import { IconMoon, IconSun, IconTrash, IconUpload } from "./ui/Icons";
import type { Theme } from "../lib/storage";
import { AGENCY_NAME, APP_SUBTITLE, APP_TITLE } from "../config";

export function Header({
  meta,
  isUsingSeed,
  isUploading,
  onUpload,
  onReset,
  theme,
  onToggleTheme,
}: {
  meta: DataMeta | null;
  isUsingSeed: boolean;
  isUploading: boolean;
  onUpload: (file: File) => void;
  onReset: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--page)]/85 backdrop-blur">
      <div
        className="shimmer-line h-[3px]"
        style={{
          background:
            "linear-gradient(90deg, var(--series-1), var(--brand-gold), var(--series-3), var(--series-7), var(--series-2), var(--series-1))",
        }}
        aria-hidden="true"
      />
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div
            className="grid h-9 w-9 place-items-center rounded-xl text-white"
            style={{
              background: "linear-gradient(135deg, var(--brand), var(--brand-soft))",
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.15), 0 0 0 1px var(--brand-gold-soft), 0 6px 18px -4px color-mix(in oklab, var(--brand) 60%, transparent)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 7-8" />
              <path d="M14 6h7v7" />
            </svg>
          </div>
          <div className="leading-tight">
            <h1 className="font-serif text-lg font-semibold tracking-tight">{APP_TITLE}</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {AGENCY_NAME} · {APP_SUBTITLE}
            </p>
          </div>
        </div>

        <div className="mx-1 hidden h-8 w-px bg-[var(--border)] sm:block" />

        {meta && (
          <div className="flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
            <span
              className={`relative h-1.5 w-1.5 rounded-full ${
                isUsingSeed ? "bg-[var(--status-warning)] text-[var(--status-warning)]" : "animate-live-dot bg-[var(--status-good)] text-[var(--status-good)]"
              }`}
            />
            {isUsingSeed ? "מוצגים נתוני דוגמה" : `עודכן ${relativeUpdatedAt(meta.updatedAt)}`}
          </div>
        )}

        <div className="ms-auto flex items-center gap-2">
          {!isUsingSeed && (
            <button
              type="button"
              onClick={onReset}
              title="שחזור נתוני דוגמה"
              className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)]"
            >
              <IconTrash className="h-4 w-4 text-[var(--text-muted)]" />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleTheme}
            title="החלפת ערכת נושא"
            className="grid h-9 w-9 place-items-center rounded-lg border border-[var(--border)] hover:bg-[var(--surface-2)]"
          >
            {theme === "dark" ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <IconUpload className="h-4 w-4" />
            {isUploading ? "מעלה…" : "עדכון דו״ח יומי"}
          </button>
        </div>
      </div>
    </header>
  );
}
