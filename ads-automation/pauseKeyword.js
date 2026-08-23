// Pauses one keyword (by exact text). Dry-run by default — add --confirm to actually pause it.
//
// Usage:
//   node pauseKeyword.js --keyword "הראל ביטוח בריאות טלפון" [--campaign "שם מלא/חלקי"] [--confirm]
import { enums } from "google-ads-api";
import { getCustomer, formatIls } from "./lib/client.js";
import { fail, parseCliArgs, printDryRunNotice } from "./lib/cli.js";

const args = parseCliArgs({ keyword: { type: "string" }, campaign: { type: "string" } });
if (!args.keyword) fail('חובה להעביר --keyword "טקסט מילת המפתח המדויק"');

const customer = getCustomer();
const safeText = args.keyword.replace(/'/g, "\\'");

const rows = await customer.query(`
  SELECT
    ad_group_criterion.resource_name,
    ad_group_criterion.status,
    ad_group_criterion.keyword.text,
    ad_group_criterion.keyword.match_type,
    campaign.name,
    ad_group.name,
    metrics.cost_micros,
    metrics.clicks,
    metrics.conversions
  FROM keyword_view
  WHERE ad_group_criterion.keyword.text = '${safeText}'
    AND ad_group_criterion.status = 'ENABLED'
    AND segments.date DURING LAST_30_DAYS
`);

if (rows.length === 0) {
  fail(`לא נמצאה מילת מפתח פעילה בשם "${args.keyword}". ודאו שהטקסט זהה בדיוק למה שמופיע בטבלה בכלי, ושהיא לא כבר מושהית.`);
}

const filtered = args.campaign ? rows.filter((r) => r.campaign.name.includes(args.campaign)) : rows;
if (filtered.length === 0) {
  fail(`נמצאה מילת המפתח, אך לא בקמפיין שמכיל "${args.campaign}". קמפיינים שבהם היא כן נמצאת: ${rows.map((r) => r.campaign.name).join(", ")}`);
}

if (filtered.length > 1) {
  console.log(`מילת המפתח "${args.keyword}" פעילה ביותר ממקום אחד — סננו לפי קמפיין עם --campaign, או שהם יושהו כולם יחד:\n`);
  filtered.forEach((r) => console.log(`  · קמפיין "${r.campaign.name}" / קבוצת מודעות "${r.ad_group.name}"`));
  console.log("");
}

console.log(`מילת מפתח: "${args.keyword}" (${filtered[0].ad_group_criterion.keyword.match_type})`);
for (const r of filtered) {
  const cost = r.metrics.cost_micros / 1_000_000;
  console.log(
    `  · ${r.campaign.name} / ${r.ad_group.name} — 30 יום אחרונים: ${formatIls(cost)}, ${r.metrics.clicks} קליקים, ${r.metrics.conversions.toFixed(1)} המרות`,
  );
}
console.log(`\nפעולה: השהיה (Pause) של ${filtered.length} רשומ${filtered.length === 1 ? "ה" : "ות"}.`);

if (!args.confirm) {
  printDryRunNotice();
  process.exit(0);
}

const result = await customer.adGroupCriteria.update(
  filtered.map((r) => ({ resource_name: r.ad_group_criterion.resource_name, status: enums.AdGroupCriterionStatus.PAUSED })),
);

console.log(`\n✅ הושהתה בהצלחה (${result.results?.length ?? filtered.length} רשומות עודכנו).`);
console.log("אפשר להפעיל בחזרה בכל רגע ידנית ב-Google Ads (Status → Enable) — זה תמיד הפיך.\n");
