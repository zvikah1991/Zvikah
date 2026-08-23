// Adds a Phrase-match copy of an existing (broad-match) keyword in the same ad group,
// at the same bid. Dry-run by default — add --confirm to actually create it.
//
// The old broad-match keyword is left running untouched — this script never pauses
// anything. That's intentional: add the tighter version, confirm it's serving for a
// day or two, THEN pause the old one yourself (or via pauseKeyword.js) once you're sure
// coverage didn't drop. Skipping straight to --pause-original is the one thing this
// script will refuse to automate.
//
// Usage:
//   node addPhraseKeyword.js --keyword "הראל ביטוח בריאות טלפון" [--campaign "שם מלא/חלקי"] [--confirm]
import { enums } from "google-ads-api";
import { getCustomer, formatIls } from "./lib/client.js";
import { fail, parseCliArgs, printDryRunNotice } from "./lib/cli.js";

const args = parseCliArgs({ keyword: { type: "string" }, campaign: { type: "string" } });
if (!args.keyword) fail('חובה להעביר --keyword "טקסט מילת המפתח המדויק"');

const customer = getCustomer();
const safeText = args.keyword.replace(/'/g, "\\'");

const rows = await customer.query(`
  SELECT
    ad_group.resource_name,
    ad_group_criterion.cpc_bid_micros,
    ad_group_criterion.keyword.match_type,
    campaign.name,
    ad_group.name
  FROM keyword_view
  WHERE ad_group_criterion.keyword.text = '${safeText}'
    AND ad_group_criterion.keyword.match_type = 'BROAD'
    AND ad_group_criterion.status = 'ENABLED'
`);

if (rows.length === 0) {
  fail(`לא נמצאה מילת מפתח פעילה ב"התאמה רחבה" בשם "${args.keyword}".`);
}

const filtered = args.campaign ? rows.filter((r) => r.campaign.name.includes(args.campaign)) : rows;
if (filtered.length === 0) {
  fail(`נמצאה מילת המפתח, אך לא בקמפיין שמכיל "${args.campaign}". קמפיינים שבהם היא כן נמצאת: ${rows.map((r) => r.campaign.name).join(", ")}`);
}
if (filtered.length > 1) {
  fail(
    `מילת המפתח "${args.keyword}" קיימת ביותר מקבוצת מודעות אחת — הריצו שוב עם --campaign כדי לבחור אחת:\n` +
      filtered.map((r) => `  · ${r.campaign.name} / ${r.ad_group.name}`).join("\n"),
  );
}

const source = filtered[0];
console.log(`מוסיפים גרסת Phrase ל: "${args.keyword}"`);
console.log(`  · קמפיין: ${source.campaign.name} / קבוצת מודעות: ${source.ad_group.name}`);
console.log(`  · הצעת מחיר: ${source.ad_group_criterion.cpc_bid_micros ? formatIls(source.ad_group_criterion.cpc_bid_micros / 1_000_000) : "לפי ברירת המחדל של קבוצת המודעות"}`);
console.log(`  · הגרסה הקיימת ב"התאמה רחבה" תישאר פעילה כרגיל — לא נוגעים בה.`);

if (!args.confirm) {
  printDryRunNotice();
  process.exit(0);
}

const newKeyword = {
  ad_group: source.ad_group.resource_name,
  status: enums.AdGroupCriterionStatus.ENABLED,
  keyword: { text: args.keyword, match_type: enums.KeywordMatchType.PHRASE },
};
if (source.ad_group_criterion.cpc_bid_micros) newKeyword.cpc_bid_micros = source.ad_group_criterion.cpc_bid_micros;

const result = await customer.adGroupCriteria.create([newKeyword]);

console.log(`\n✅ נוצרה בהצלחה: "${args.keyword}" (Phrase match) ב-${source.ad_group.name}.`);
console.log(`   ${result.results?.[0]?.resource_name ?? ""}`);
console.log('תנו לה יום-יומיים לצבור חשיפות, ואז — אם התוצאות טובות — השהו את הגרסה ב"התאמה רחבה" עם pauseKeyword.js.\n');
