// Single place to rebrand the app for a different agency/agent.
export const AGENCY_NAME = "Zvikah";
export const APP_TITLE = "דשבורד מכירות";
export const APP_SUBTITLE = "ניהול תהליכי מכירה";

// The two process types that count as real sales premium for this report.
// Everything else (agent appointments, portfolio transfers, etc.) is excluded
// from the main figures; agent appointments get their own separate line.
export const CORE_PROCESS_TYPES = ["שיחלוף מוצר", "רכישת מוצר חדש"];
export const AGENT_APPOINTMENT_PROCESS_TYPES = ["מינוי סוכן ללא שינויים", "מינוי סוכן עם שינויים"];

// Monthly commission scale: the multiplier applied to a rep's total issued (הופק)
// core premium for the month is looked up by which bracket that total falls into
// (a single lookup against the whole amount, not a progressive/marginal calc).
export const COMMISSION_BRACKETS: { max: number; multiplier: number }[] = [
  { max: 1_500, multiplier: 2 },
  { max: 3_000, multiplier: 2.5 },
  { max: 4_500, multiplier: 3 },
  { max: 5_500, multiplier: 3.5 },
  { max: 9_900, multiplier: 4 },
];
// Agent-appointment premium earns half commission and is never run through the bracket table above.
export const AGENT_APPOINTMENT_COMMISSION_RATE = 0.5;
// The agency owner isn't a commissioned rep.
export const COMMISSION_EXCLUDED_REPS = ["צביקה חדד"];

// One-off manual multiplier overrides for a specific rep in a specific month
// (e.g. a negotiated bonus rate), applied instead of the bracket lookup above.
export const COMMISSION_MULTIPLIER_OVERRIDES: { month: string; rep: string; multiplier: number }[] = [
  { month: "2026-08", rep: "ניב תורתי", multiplier: 4 },
];
