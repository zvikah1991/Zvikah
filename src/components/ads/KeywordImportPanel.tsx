import { useRef, useState } from "react";
import type { AdsMeta } from "../../types";
import { relativeUpdatedAt } from "../../lib/format";
import { IconClipboardList, IconTrash, IconUpload } from "../ui/Icons";
import { Card } from "../ui/Card";

export function KeywordImportPanel({
  meta,
  isUsingSeed,
  isUploading,
  targetCostPerCall,
  onUpload,
  onPaste,
  onTargetChange,
  onReset,
}: {
  meta: AdsMeta | null;
  isUsingSeed: boolean;
  isUploading: boolean;
  targetCostPerCall: number;
  onUpload: (file: File) => void;
  onPaste: (text: string) => void;
  onTargetChange: (target: number) => void;
  onReset: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");

  return (
    <Card className="animate-fade-up flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] px-2.5 py-1 text-xs text-[var(--text-secondary)]">
          <span
            className={`relative h-1.5 w-1.5 rounded-full ${
              isUsingSeed ? "bg-[var(--status-warning)]" : "animate-live-dot bg-[var(--status-good)]"
            }`}
          />
          {isUsingSeed ? "מוצגים נתוני דוגמה" : meta ? `עודכן ${relativeUpdatedAt(meta.updatedAt)}` : ""}
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
          יעד עלות לשיחה (₪)
          <input
            type="number"
            min={0}
            step={0.5}
            value={targetCostPerCall}
            onChange={(e) => onTargetChange(Math.max(0, Number(e.target.value) || 0))}
            className="w-20 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-sm tabular-nums outline-none"
          />
        </label>

        <div className="ms-auto flex flex-wrap items-center gap-2">
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
            onClick={() => setPasteOpen((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--surface-2)]"
          >
            <IconClipboardList className="h-4 w-4" />
            הדבקת נתונים
          </button>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.txt"
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
            {isUploading ? "מעלה…" : "העלאת דוח מילות מפתח"}
          </button>
        </div>
      </div>

      {pasteOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="text-xs text-[var(--text-muted)]">
            בגוגל אדס: קמפיין → Keywords → מסמנים את כל הטבלה (Ctrl+A) ומעתיקים (Ctrl+C) — ואז מדביקים כאן. נדרשות לפחות עמודות
            "מילת מפתח" ו"עלות".
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            dir="ltr"
            rows={5}
            placeholder="Keyword	Match type	Cost	Clicks	Impr.	Calls…"
            className="w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 font-mono text-xs outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPasteOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs text-[var(--text-muted)] hover:bg-[var(--surface)]"
            >
              ביטול
            </button>
            <button
              type="button"
              disabled={!pasteText.trim()}
              onClick={() => {
                onPaste(pasteText);
                setPasteText("");
                setPasteOpen(false);
              }}
              className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              ייבוא הנתונים
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
