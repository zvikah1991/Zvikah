import { parseArgs } from "node:util";

/**
 * Every mutating script shares this contract: without --confirm, nothing is sent to Google —
 * the script only prints what it *would* do. This is the safety net promised to the user:
 * no change ever happens without an explicit, separate --confirm run.
 */
export function parseCliArgs(options) {
  const { values } = parseArgs({
    options: { confirm: { type: "boolean", default: false }, ...options },
    strict: false,
  });
  return values;
}

export function printDryRunNotice() {
  console.log("\n🔎 זו הרצת בדיקה (dry run) — שום דבר לא בוצע בפועל בחשבון.");
  console.log("   כדי לבצע את השינוי בפועל, הריצו את אותה הפקודה שוב עם --confirm בסוף.\n");
}

export function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}
