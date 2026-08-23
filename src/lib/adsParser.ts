import type { AdsDayRecord } from "../types";
import { detectDelimiter, matchAlias, splitLine, toNumber } from "./csvUtils";

// Google Ads' own CSV/table exports don't use a fixed column layout — the exact
// headers depend on report type and UI language (Hebrew or English). Matching by
// keyword (not position) lets the same importer accept a "Campaigns" report, a
// "Search terms" report, or a table copy-pasted straight from the Ads UI.
const HEADER_ALIASES: Record<"date" | "cost" | "clicks" | "impressions" | "calls", string[]> = {
  date: ["יום", "תאריך", "day", "date"],
  cost: ["עלות", "cost", "spend", "הוצאה"],
  clicks: ["קליקים", "clicks"],
  impressions: ["חשיפות", "impr", "impression"],
  calls: ["שיחות", "call", "המר", "conver"],
};

export class AdsParseError extends Error {}

const HEBREW_MONTHS: Record<string, number> = {
  ינו: 1, פבר: 2, מרץ: 3, אפר: 4, מאי: 5, יונ: 6, יול: 7, אוג: 8, ספט: 9, אוק: 10, נוב: 11, דצמ: 12,
};

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toISODate(cell: string | undefined): string | null {
  if (!cell) return null;
  const s = cell.trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) return `${iso[1]}-${pad2(Number(iso[2]))}-${pad2(Number(iso[3]))}`;

  const dmy = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
  if (dmy) {
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${y}-${pad2(Number(dmy[2]))}-${pad2(Number(dmy[1]))}`;
  }

  const heb = s.match(/^(\d{1,2})\s+ב?([א-ת]{3,4})['׳]?\s+(\d{4})$/);
  if (heb) {
    const monthKey = Object.keys(HEBREW_MONTHS).find((k) => heb[2].startsWith(k));
    if (monthKey) return `${heb[3]}-${pad2(HEBREW_MONTHS[monthKey])}-${pad2(Number(heb[1]))}`;
  }

  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }
  return null;
}

/**
 * Parses a daily performance export from Google Ads — either a downloaded CSV
 * (which typically has a title/date-range preamble and a totals row at the
 * bottom) or a table copy-pasted directly from the Ads UI (tab-separated).
 * Non-data rows (titles, blank lines, the "סה"כ / Total" row) are skipped
 * rather than treated as errors, since their exact wording varies by locale.
 */
export function parseAdsExport(text: string): AdsDayRecord[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new AdsParseError("לא נמצא תוכן להעלאה. יש להעתיק/להעלות את דוח הביצועים היומי מגוגל אדס.");

  let headerIndex = -1;
  let delimiter = ",";
  let columnIndex: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};

  for (let i = 0; i < lines.length; i++) {
    const delim = detectDelimiter(lines[i]);
    const cells = splitLine(lines[i], delim);
    const idx: Partial<Record<keyof typeof HEADER_ALIASES, number>> = {};
    cells.forEach((cell, ci) => {
      for (const field of Object.keys(HEADER_ALIASES) as (keyof typeof HEADER_ALIASES)[]) {
        if (idx[field] === undefined && matchAlias(cell, HEADER_ALIASES[field])) idx[field] = ci;
      }
    });
    if (idx.date !== undefined && idx.cost !== undefined) {
      headerIndex = i;
      delimiter = delim;
      columnIndex = idx;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new AdsParseError('לא זוהו עמודות "תאריך" ו"עלות" בקובץ. ודא/י שמדובר בדוח ביצועים יומי שיוצא/הועתק מגוגל אדס.');
  }

  const records: AdsDayRecord[] = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const cells = splitLine(lines[i], delimiter);
    const date = toISODate(cells[columnIndex.date!]);
    if (!date) continue; // preamble/total/footer rows — silently skipped, not an error

    records.push({
      date,
      cost: toNumber(cells[columnIndex.cost!]),
      clicks: columnIndex.clicks !== undefined ? toNumber(cells[columnIndex.clicks]) : null,
      impressions: columnIndex.impressions !== undefined ? toNumber(cells[columnIndex.impressions]) : null,
      calls: columnIndex.calls !== undefined ? toNumber(cells[columnIndex.calls]) : 0,
    });
  }

  if (records.length === 0) {
    throw new AdsParseError("לא נמצאו שורות נתונים תקינות. ודא/י שהדוח מכיל לפחות עמודות תאריך ועלות עם ערכים.");
  }

  // A day can appear more than once (e.g. split by campaign) — merge into one row per day.
  const byDate = new Map<string, AdsDayRecord>();
  for (const r of records) {
    const existing = byDate.get(r.date);
    if (!existing) {
      byDate.set(r.date, r);
    } else {
      byDate.set(r.date, {
        date: r.date,
        cost: existing.cost + r.cost,
        clicks: existing.clicks !== null || r.clicks !== null ? (existing.clicks ?? 0) + (r.clicks ?? 0) : null,
        impressions:
          existing.impressions !== null || r.impressions !== null ? (existing.impressions ?? 0) + (r.impressions ?? 0) : null,
        calls: existing.calls + r.calls,
      });
    }
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function parseAdsFile(file: File): Promise<AdsDayRecord[]> {
  const text = await file.text();
  return parseAdsExport(text);
}
