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
