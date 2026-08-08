import type { CategoryPoint } from "./aggregations";

const SERIES_VARS = [
  "--series-1",
  "--series-2",
  "--series-3",
  "--series-4",
  "--series-5",
  "--series-6",
  "--series-7",
  "--series-8",
] as const;

export const OTHER_COLOR = "var(--text-muted)";

/**
 * Assigns each category a fixed color slot based on its rank in the FULL
 * (unfiltered) dataset, so a category's color never shifts when the user
 * changes filters — only the set of visible categories changes.
 */
export function buildColorScale(fullDatasetPoints: CategoryPoint[]): Map<string, string> {
  const map = new Map<string, string>();
  fullDatasetPoints.forEach((point, index) => {
    if (index < SERIES_VARS.length) {
      map.set(point.key, `var(${SERIES_VARS[index]})`);
    }
  });
  return map;
}

export function colorFor(scale: Map<string, string>, key: string): string {
  if (key === "אחר" || key === "לא צוין") return OTHER_COLOR;
  return scale.get(key) ?? OTHER_COLOR;
}
