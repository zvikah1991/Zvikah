const currencyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("he-IL");

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

const dateFormatter = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = parseISODate(iso);
  if (!d) return "—";
  return dateFormatter.format(d);
}

export function parseISODate(iso: string): Date | null {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

const monthFormatter = new Intl.DateTimeFormat("he-IL", { month: "long", year: "numeric" });
const monthShortFormatter = new Intl.DateTimeFormat("he-IL", { month: "long", year: "2-digit" });

/** yyyy-mm -> "אוגוסט 2026" */
export function formatMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return "—";
  return monthFormatter.format(new Date(y, m - 1, 1));
}

/** yyyy-mm -> "אוגוסט 26" — always includes the year, since the same month name can repeat across years. */
export function formatMonthKeyShort(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  if (!y || !m) return "—";
  return monthShortFormatter.format(new Date(y, m - 1, 1));
}

export function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** yyyy-mm -> the first/last ISO date of that calendar month. */
export function monthRangeISO(monthKey: string): { from: string; to: string } {
  const [y, m] = monthKey.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return { from: `${y}-${pad2(m)}-01`, to: `${y}-${pad2(m)}-${pad2(lastDay)}` };
}

/** The first/last ISO date of a calendar year. */
export function yearRangeISO(year: number): { from: string; to: string } {
  return { from: `${year}-01-01`, to: `${year}-12-31` };
}

export function yearOf(iso: string): number {
  return Number(iso.slice(0, 4));
}

export function relativeUpdatedAt(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דקות`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "אתמול";
  return `לפני ${days} ימים`;
}
