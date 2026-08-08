import type { Unit } from "../types";

const currencyFormatter = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number): string {
  return currencyFormatter.format(value);
}

const unitLabels: Record<Unit, string> = {
  kg: 'ק"ג',
  unit: "יחידה",
  tray: "מארז",
};

export function unitLabel(unit: Unit): string {
  return unitLabels[unit];
}

export function unitSuffix(unit: Unit): string {
  return unit === "kg" ? ' / ק"ג' : unit === "unit" ? " / יחידה" : " / מארז";
}
