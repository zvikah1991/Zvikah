import type { KeywordPerfRecord } from "../types";
import { detectColumns, detectDelimiter, readFileAsText, splitLine, toNumber } from "./csvUtils";

// The "Keywords" report from Google Ads (Campaigns → Keywords → download, or
// Reports → Predefined reports → Keywords) — one row per keyword with its own
// cost/clicks/calls. This is what actually shows which keywords are cheap per
// call and which are expensive, so bids/budget can be redirected accordingly.
// "מחיר" (price) is the actual cost column in the Hebrew UI's own reports —
// "עלות" only shows up in some locales/report types, so both are kept.
const HEADER_ALIASES: Record<"keyword" | "matchType" | "cost" | "clicks" | "impressions" | "calls", string[]> = {
  keyword: ["מילת מפתח", "keyword"],
  matchType: ["סוג התאמה", "התאמה", "match type"],
  cost: ["מחיר", "עלות", "cost", "spend", "הוצאה"],
  clicks: ["קליקים", "clicks"],
  impressions: ["חשיפות", "impr", "impression"],
  calls: ["המרות", "שיחות", "call", "conver", "המר"],
};

const SKIP_ROW_MARKERS = ["סה\"כ", 'סה"כ', "total", "אחר: "];

export class KeywordParseError extends Error {}

function isSkipRow(firstCell: string): boolean {
  const s = firstCell.trim().toLowerCase();
  if (!s) return true;
  return SKIP_ROW_MARKERS.some((m) => s.startsWith(m.toLowerCase()));
}

/**
 * Parses a per-keyword performance export from Google Ads — a downloaded CSV
 * or a table copy-pasted from the Ads UI (Keywords tab). Title/date-range
 * preamble lines and the trailing totals row are skipped rather than treated
 * as errors, since their exact wording varies by locale.
 */
export function parseKeywordExport(text: string): KeywordPerfRecord[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) {
    throw new KeywordParseError("לא נמצא תוכן להעלאה. יש להעתיק/להעלות את דוח הביצועים לפי מילות מפתח מגוגל אדס.");
  }

  let headerIndex = -1;
  let delimiter = ",";
  let columnIndex: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};

  for (let i = 0; i < lines.length; i++) {
    const delim = detectDelimiter(lines[i]);
    const cells = splitLine(lines[i], delim);
    const idx = detectColumns(cells, HEADER_ALIASES);
    if (idx.keyword !== undefined && idx.cost !== undefined) {
      headerIndex = i;
      delimiter = delim;
      columnIndex = idx;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new KeywordParseError('לא זוהו עמודות "מילת מפתח" ו"עלות" בקובץ. ודא/י שמדובר בדוח "Keywords" מגוגל אדס.');
  }

  const byKeyword = new Map<string, KeywordPerfRecord>();
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter);
    const keyword = cells[columnIndex.keyword!]?.trim();
    if (!keyword || isSkipRow(keyword)) continue; // preamble/total/footer rows — silently skipped

    const matchType = columnIndex.matchType !== undefined ? (cells[columnIndex.matchType]?.trim() ?? null) : null;
    const row: KeywordPerfRecord = {
      keyword,
      matchType: matchType || null,
      cost: toNumber(cells[columnIndex.cost!]),
      clicks: columnIndex.clicks !== undefined ? toNumber(cells[columnIndex.clicks]) : null,
      impressions: columnIndex.impressions !== undefined ? toNumber(cells[columnIndex.impressions]) : null,
      calls: columnIndex.calls !== undefined ? toNumber(cells[columnIndex.calls]) : 0,
    };

    // The same keyword can repeat across campaigns/ad groups/date ranges — merge into one row.
    const key = `${keyword}__${matchType ?? ""}`;
    const existing = byKeyword.get(key);
    if (!existing) {
      byKeyword.set(key, row);
    } else {
      byKeyword.set(key, {
        keyword: row.keyword,
        matchType: row.matchType,
        cost: existing.cost + row.cost,
        clicks: existing.clicks !== null || row.clicks !== null ? (existing.clicks ?? 0) + (row.clicks ?? 0) : null,
        impressions:
          existing.impressions !== null || row.impressions !== null ? (existing.impressions ?? 0) + (row.impressions ?? 0) : null,
        calls: existing.calls + row.calls,
      });
    }
  }

  if (byKeyword.size === 0) {
    throw new KeywordParseError("לא נמצאו שורות נתונים תקינות. ודא/י שהדוח מכיל לפחות עמודות מילת מפתח ועלות עם ערכים.");
  }

  return Array.from(byKeyword.values()).sort((a, b) => b.cost - a.cost);
}

export async function parseKeywordFile(file: File): Promise<KeywordPerfRecord[]> {
  const text = await readFileAsText(file);
  return parseKeywordExport(text);
}
