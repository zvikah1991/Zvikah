const currencyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("he-IL");
const compactNumberFormatter = new Intl.NumberFormat("he-IL", { notation: "compact", maximumFractionDigits: 1 });

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

export function formatCurrencyCompact(value: number): string {
  return compactCurrencyFormatter.format(value);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatNumberCompact(value: number): string {
  return compactNumberFormatter.format(value);
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

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfMonthISO(offsetMonths = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function startOfYearISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-01-01`;
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
