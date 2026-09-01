import { useEffect, useState } from "react";
import clsx from "clsx";
import { AGENCY_NAME, APP_SUBTITLE, APP_TITLE } from "../config";
import { IconBarChart, IconBriefcase, IconClock, IconHome, IconPercent, IconTrophy, IconUsers } from "./ui/Icons";

const SECTIONS = [
  { id: "overview", label: "סקירה כללית", icon: IconHome },
  { id: "trends", label: "מגמות ופילוחים", icon: IconBarChart },
  { id: "leaderboard", label: "לוח מובילים", icon: IconTrophy },
  { id: "commissions", label: "עמלות", icon: IconPercent },
  { id: "activity", label: "פעילות אחרונה", icon: IconClock },
  { id: "customers", label: "לקוחות", icon: IconUsers },
  { id: "deals", label: "כל העסקאות", icon: IconBriefcase },
];

/** Primary navigation: a vertical sidebar on wide screens, a horizontal scrollable bar on narrow ones — same sections, same active-section tracking. */
export function Sidebar() {
  const [active, setActive] = useState(SECTIONS[0].id);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    for (const section of SECTIONS) {
      const el = document.getElementById(section.id);
      if (!el) continue;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(section.id);
        },
        { rootMargin: "-130px 0px -65% 0px", threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    }
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      {/* Desktop / tablet: fixed-height vertical sidebar. */}
      <aside className="sticky top-0 z-30 hidden h-screen w-60 shrink-0 flex-col border-e border-[var(--border)] bg-[var(--surface)] px-3 py-5 lg:flex">
        <div className="flex items-center gap-2.5 px-1.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--brand)] text-white">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 7-8" />
              <path d="M14 6h7v7" />
            </svg>
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-sm font-bold text-[var(--text-primary)]">{APP_TITLE}</h1>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {AGENCY_NAME} · {APP_SUBTITLE}
            </p>
          </div>
        </div>

        <nav className="mt-7 flex flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-thin">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                aria-current={isActive ? "true" : undefined}
                className={clsx(
                  "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-[color-mix(in_oklab,var(--brand)_10%,transparent)] font-semibold text-[var(--brand)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
                )}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{section.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Mobile / narrow tablet: horizontal scrollable pill bar instead of a permanent column. */}
      <nav className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur lg:hidden">
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-thin">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              className={clsx(
                "shrink-0 rounded-lg px-3 py-1.5 text-sm whitespace-nowrap transition-colors",
                active === section.id
                  ? "bg-[color-mix(in_oklab,var(--brand)_10%,transparent)] font-semibold text-[var(--brand)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
      </nav>
    </>
  );
}
