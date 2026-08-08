import { Button } from "./ui/Button";
import { ShieldIcon, SnowflakeIcon, TruckIcon } from "./ui/Icons";

const perks = [
  { icon: SnowflakeIcon, text: "טרי מדי יום מהתפוסה" },
  { icon: TruckIcon, text: "משלוח עד הבית או איסוף עצמי" },
  { icon: ShieldIcon, text: "תשלום מאובטח בכרטיס אשראי" },
];

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, var(--brand-dark), var(--brand))" }}>
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 20%, white 0, transparent 35%), radial-gradient(circle at 85% 0%, white 0, transparent 30%)",
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="max-w-xl animate-fade-up">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-[var(--accent-light)] ring-1 ring-white/20">
            ✧ ותיק, אמין ואיכותי - כבר שנים בשירותכם
          </span>
          <h1 className="font-display mt-5 text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            דגים טריים ופירות ים
            <br />
            <span className="text-[var(--accent-light)]">ישר מהים אליכם הביתה</span>
          </h1>
          <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
            הזמינו אונליין מהמחירון המלא שלנו, ואנחנו נדאג לטריות, לאריזה הקפדית ולמשלוח עד הבית - או שתאספו בעצמכם מהחנות.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button variant="secondary" size="lg" onClick={() => document.getElementById("sea")?.scrollIntoView({ behavior: "smooth" })}>
              לצפייה במחירון ולהזמנה
            </Button>
            <a
              href="tel:0500000000"
              className="inline-flex h-13 items-center justify-center rounded-xl border border-white/25 px-6 text-base font-semibold text-white transition-colors hover:bg-white/10"
            >
              התקשרו להזמנה טלפונית
            </a>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3">
            {perks.map((perk) => (
              <div key={perk.text} className="flex items-center gap-2 text-sm font-medium text-white/85">
                <perk.icon className="h-4.5 w-4.5 text-[var(--accent-light)]" />
                {perk.text}
              </div>
            ))}
          </div>
        </div>
      </div>
      <svg className="wave-divider relative -mb-px" viewBox="0 0 1440 60" preserveAspectRatio="none">
        <path d="M0 30c240 30 480 30 720 15s480-15 720 15V60H0Z" fill="var(--page)" />
      </svg>
    </section>
  );
}
