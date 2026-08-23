// Shared low-level helpers for parsing exports copy-pasted or downloaded from
// the Google Ads UI, which can be comma-CSV (file download) or tab-separated
// (table copied straight from the browser) and mix Hebrew/English headers.

export function detectDelimiter(headerLine: string): string {
  const tabCount = (headerLine.match(/\t/g) ?? []).length;
  const commaCount = (headerLine.match(/,/g) ?? []).length;
  return tabCount > commaCount ? "\t" : ",";
}

/** Splits one CSV line on the given delimiter, respecting double-quoted fields. */
export function splitLine(line: string, delimiter: string): string[] {
  if (delimiter === "\t") return line.split("\t").map((c) => c.trim());
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      cells.push(cur.trim());
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur.trim());
  return cells;
}

export function matchAlias(header: string, aliases: string[]): boolean {
  const h = header.trim().toLowerCase();
  return aliases.some((a) => h.includes(a.toLowerCase()));
}

export function toNumber(cell: string | undefined): number {
  if (!cell) return 0;
  const cleaned = cell.replace(/[^\d.,-]/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Finds each field's column index in a header row. Google Ads' real headers
 * often nest one field's name inside another's — "מחיר" (cost) sits inside
 * "מחיר ממוצע" (avg. CPC) and "מחיר / המרה" (cost/conv.), "המרות"
 * (conversions) sits inside "שיעור המרות" (conv. rate), and "מילת מפתח"
 * (keyword) sits inside "סטטוס מילת מפתח" (keyword status) — all appearing
 * *before* the real column. A plain first-substring-match scan silently
 * grabs the wrong column. So this tries an exact (trimmed, case-insensitive)
 * header match across the whole row first, and only falls back to substring
 * matching per field if no exact match exists anywhere for it.
 */
export function detectColumns<F extends string>(cells: string[], aliasesByField: Record<F, string[]>): Partial<Record<F, number>> {
  const fields = Object.keys(aliasesByField) as F[];
  const idx: Partial<Record<F, number>> = {};

  for (const field of fields) {
    const aliases = aliasesByField[field].map((a) => a.toLowerCase());
    const exactIndex = cells.findIndex((c) => aliases.includes(c.trim().toLowerCase()));
    if (exactIndex !== -1) idx[field] = exactIndex;
  }

  cells.forEach((cell, ci) => {
    for (const field of fields) {
      if (idx[field] === undefined && matchAlias(cell, aliasesByField[field])) idx[field] = ci;
    }
  });

  return idx;
}

/**
 * Reads a text file with encoding sniffed from its BOM. Google Ads' own CSV
 * downloads are UTF-16LE (Excel's default "CSV" export encoding) — decoding
 * that as UTF-8 (what File.text() always does) produces garbage. A table
 * copy-pasted from the browser has no such issue since it never goes through
 * a file at all.
 */
export async function readFileAsText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(buffer);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(buffer);
  return new TextDecoder("utf-8").decode(buffer); // handles UTF-8 with/without BOM
}
