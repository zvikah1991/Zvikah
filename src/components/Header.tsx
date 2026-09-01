import { useRef } from "react";
import type { DataMeta } from "../types";
import { relativeUpdatedAt } from "../lib/format";
import { IconMoon, IconSun, IconTrash, IconUpload } from "./ui/Icons";
import type { Theme } from "../lib/storage";
import { AGENCY_NAME, APP_SUBTITLE, APP_TITLE } from "../config";
import { Button } from "./ui/Button";

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
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--page)]/95 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        {/* Branding shows here only when the sidebar is collapsed to a horizontal bar (narrow screens). */}
        <div className="flex items-center gap-2.5 lg:hidden">
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white"
            style={{ background: "linear-gradient(150deg, var(--shell-accent), var(--electric-strong))" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 7-8" />
              <path d="M14 6h7v7" />
            </svg>
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-bold text-[var(--text-primary)]">{APP_TITLE}</h1>
            <p className="text-xs text-[var(--text-muted)]">
              {AGENCY_NAME} · {APP_SUBTITLE}
            </p>
          </div>
        </div>

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
            <Button variant="ghost" size="icon" onClick={onReset} title="שחזור נתוני דוגמה">
              <IconTrash className="h-4 w-4" />
            </Button>
          )}

          <Button variant="ghost" size="icon" onClick={onToggleTheme} title="החלפת ערכת נושא">
            {theme === "dark" ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
          </Button>

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
          <Button variant="primary" disabled={isUploading} onClick={() => inputRef.current?.click()}>
            <IconUpload className="h-4 w-4" />
            {isUploading ? "מעלה…" : "עדכון דו״ח יומי"}
          </Button>
        </div>
      </div>
    </header>
  );
}
