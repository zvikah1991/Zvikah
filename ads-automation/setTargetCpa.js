// Switches a campaign's bidding strategy to Target CPA (or updates the target if it's
// already on Target CPA). Dry-run by default — add --confirm to actually apply it.
//
// Google recommends stepping this down gradually rather than jumping straight to the
// final number — see the README's "safe rollout" section before running this at 7.
//
// Usage:
//   node setTargetCpa.js --campaign "שם מלא/חלקי" --target 13 [--confirm]
//   node setTargetCpa.js --all --target 13 [--confirm]
import { enums, toMicros } from "google-ads-api";
import { getCustomer, formatIls } from "./lib/client.js";
import { fail, parseCliArgs, printDryRunNotice } from "./lib/cli.js";

const args = parseCliArgs({ campaign: { type: "string" }, target: { type: "string" }, all: { type: "boolean", default: false } });
if (!args.target || !Number(args.target) || Number(args.target) <= 0) fail("חובה להעביר --target עם מספר שקלים חיובי, למשל --target 13");
if (!args.campaign && !args.all) fail('חובה להעביר --campaign "שם" (או חלק ממנו), או --all כדי להחיל על כל הקמפיינים הפעילים.');

const targetMicros = toMicros(Number(args.target));
const customer = getCustomer();

const rows = await customer.query(`
  SELECT
    campaign.resource_name,
    campaign.name,
    campaign.status,
    campaign.bidding_strategy,
    campaign.bidding_strategy_type,
    campaign.target_cpa.target_cpa_micros
  FROM campaign
  WHERE campaign.status = 'ENABLED'
`);

const candidates = args.all ? rows : rows.filter((r) => r.campaign.name.includes(args.campaign));
if (candidates.length === 0) {
  fail(args.all ? "לא נמצאו קמפיינים פעילים בחשבון." : `לא נמצא קמפיין פעיל שמכיל "${args.campaign}".`);
}

const portfolioBlocked = candidates.filter((r) => r.campaign.bidding_strategy);
const eligible = candidates.filter((r) => !r.campaign.bidding_strategy);

if (portfolioBlocked.length > 0) {
  console.log("⚠️  הקמפיינים הבאים משתמשים באסטרטגיית הצעות מחיר משותפת (Portfolio) — לא משנים אותם אוטומטית");
  console.log("    כי זה עלול להשפיע על קמפיינים אחרים שמשתפים אותה אסטרטגיה. לנתק ידנית קודם:");
  console.log("    Campaign → Settings → Bidding → Change bid strategy → New bid strategy (לקמפיין הזה בלבד).\n");
  portfolioBlocked.forEach((r) => console.log(`  · ${r.campaign.name}`));
  console.log("");
}

if (eligible.length === 0) fail("אין קמפיינים שאפשר לעדכן ישירות (כולם על אסטרטגיה משותפת — טפלו בזה קודם).");

console.log(`יעד חדש: Target CPA = ${formatIls(Number(args.target))} לשיחה\n`);
for (const r of eligible) {
  const current = r.campaign.bidding_strategy_type;
  const currentTarget = r.campaign.target_cpa?.target_cpa_micros ? formatIls(r.campaign.target_cpa.target_cpa_micros / 1_000_000) : null;
  console.log(`  · ${r.campaign.name} — כרגע: ${current}${currentTarget ? ` (יעד נוכחי ${currentTarget})` : ""}`);
}

if (!args.confirm) {
  printDryRunNotice();
  process.exit(0);
}

const result = await customer.campaigns.update(
  eligible.map((r) => ({ resource_name: r.campaign.resource_name, target_cpa: { target_cpa_micros: targetMicros } })),
);

console.log(`\n✅ עודכן בהצלחה (${result.results?.length ?? eligible.length} קמפיינים).`);
console.log("עקבו מקרוב ב-3-4 הימים הקרובים — אם כמות השיחות יורדת, אפשר תמיד להריץ שוב עם יעד גבוה יותר (ולא רק לכיוון 7).\n");
