import type { DataMeta, SalesRecord } from "../types";

const RECORDS_KEY = "zvikah.sales.records.v1";
const META_KEY = "zvikah.sales.meta.v1";
const THEME_KEY = "zvikah.theme.v1";

export function loadStoredData(): { records: SalesRecord[]; meta: DataMeta } | null {
  try {
    const rawRecords = localStorage.getItem(RECORDS_KEY);
    const rawMeta = localStorage.getItem(META_KEY);
    if (!rawRecords || !rawMeta) return null;
    return { records: JSON.parse(rawRecords), meta: JSON.parse(rawMeta) };
  } catch {
    return null;
  }
}

export function saveData(records: SalesRecord[], meta: DataMeta): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

export function clearStoredData(): void {
  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(META_KEY);
}

export type Theme = "light" | "dark" | "system";

export function loadTheme(): Theme {
  const t = localStorage.getItem(THEME_KEY);
  return t === "light" || t === "dark" || t === "system" ? t : "system";
}

export function saveTheme(theme: Theme): void {
  localStorage.setItem(THEME_KEY, theme);
}
