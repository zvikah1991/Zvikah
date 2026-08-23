// Read-only: pulls the same per-keyword numbers the Keywords report gives you, straight
// from the API — no manual export/paste needed. Safe to run any time, changes nothing.
//
// Usage:
//   node listKeywords.js [--days 7|30|90] [--out FILE.csv]
import { writeFileSync } from "node:fs";
import { getCustomer, formatIls } from "./lib/client.js";
import { parseCliArgs } from "./lib/cli.js";

const DURING_BY_DAYS = { 7: "LAST_7_DAYS", 30: "LAST_30_DAYS", 90: "LAST_90_DAYS" };

const args = parseCliArgs({ days: { type: "string", default: "30" }, out: { type: "string" } });
const during = DURING_BY_DAYS[args.days];
if (!during) {
  console.error(`--days חייב להיות 7, 30 או 90 (התקבל: ${args.days})`);
  process.exit(1);
}

const customer = getCustomer();

const rows = await customer.query(`
  SELECT
    ad_group_criterion.keyword.text,
    ad_group_criterion.keyword.match_type,
    ad_group_criterion.status,
    campaign.name,
    ad_group.name,
    metrics.cost_micros,
    metrics.clicks,
    metrics.impressions,
    metrics.conversions
  FROM keyword_view
  WHERE segments.date DURING ${during}
    AND ad_group_criterion.status != 'REMOVED'
  ORDER BY metrics.cost_micros DESC
`);

const byKeyword = new Map();
for (const row of rows) {
  const text = row.ad_group_criterion.keyword.text;
  const matchType = row.ad_group_criterion.keyword.match_type;
  const key = `${text}__${matchType}`;
  const cost = row.metrics.cost_micros / 1_000_000;
  const existing = byKeyword.get(key);
  if (existing) {
    existing.cost += cost;
    existing.clicks += row.metrics.clicks;
    existing.impressions += row.metrics.impressions;
    existing.conversions += row.metrics.conversions;
  } else {
    byKeyword.set(key, {
      text,
      matchType,
      cost,
      clicks: row.metrics.clicks,
      impressions: row.metrics.impressions,
      conversions: row.metrics.conversions,
    });
  }
}

const merged = Array.from(byKeyword.values()).sort((a, b) => b.cost - a.cost);
const totalCost = merged.reduce((s, r) => s + r.cost, 0);
const totalConversions = merged.reduce((s, r) => s + r.conversions, 0);

console.log(`\nמילות מפתח: ${merged.length} · הוצאה: ${formatIls(totalCost)} · המרות: ${totalConversions.toFixed(1)} · ${
  totalConversions > 0 ? `עלות/המרה: ${formatIls(totalCost / totalConversions)}` : ""
}\n`);

console.log(["מילת מפתח", "התאמה", "עלות", "קליקים", "המרות", "עלות/המרה"].join("\t"));
for (const r of merged.slice(0, 30)) {
  const costPer = r.conversions > 0 ? formatIls(r.cost / r.conversions) : "—";
  console.log([r.text, r.matchType, formatIls(r.cost), r.clicks, r.conversions.toFixed(1), costPer].join("\t"));
}
if (merged.length > 30) console.log(`… ועוד ${merged.length - 30} מילות מפתח`);

if (args.out) {
  const header = "מילת מפתח,סוג התאמה,מחיר,קליקים,חשיפות,המרות";
  const csvRows = merged.map((r) =>
    [r.text, r.matchType, r.cost.toFixed(2), r.clicks, r.impressions, r.conversions.toFixed(2)]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  writeFileSync(args.out, "﻿" + [header, ...csvRows].join("\n"), "utf8");
  console.log(`\n💾 נשמר ל-${args.out} — אפשר להעלות את הקובץ הזה ישירות לכלי בדשבורד (לשונית "קמפיין גוגל אדס").`);
}
