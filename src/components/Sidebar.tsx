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

/** Primary navigation: a dark-navy brand rail on wide screens (a strategic dark
    signature surface, not a whole-app dark mode), a horizontal scrollable bar on
    narrow ones — same sections, same active-section tracking. */
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
      {/* Desktop / tablet: fixed-height dark-navy brand rail. */}
      <aside
        className="sticky top-0 z-30 hidden h-screen w-64 shrink-0 flex-col px-3 py-5 lg:flex"
        style={{ background: "var(--shell-bg)", borderInlineEnd: "1px solid var(--shell-border)" }}
      >
        <div className="flex items-center gap-3 px-2">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
            style={{ background: "linear-gradient(150deg, var(--shell-accent), var(--electric-strong))", boxShadow: "0 6px 16px -6px rgba(79,143,247,0.55)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l6-6 4 4 7-8" />
              <path d="M14 6h7v7" />
            </svg>
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-[15px] font-bold tracking-tight" style={{ color: "var(--shell-text)" }}>
              {APP_TITLE}
            </h1>
            <p className="truncate text-xs" style={{ color: "var(--shell-text-dim)" }}>
              {AGENCY_NAME} · {APP_SUBTITLE}
            </p>
          </div>
        </div>

        <div className="mx-2 mt-6 h-px" style={{ background: "var(--shell-border)" }} aria-hidden="true" />

        <nav className="mt-4 flex flex-1 flex-col gap-0.5 overflow-y-auto scrollbar-thin" aria-label="ניווט ראשי">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                aria-current={isActive ? "true" : undefined}
                className="group relative flex items-center gap-3 rounded-lg border-s-2 border-s-transparent px-2.5 py-2.5 text-sm transition-all"
                style={{
                  color: isActive ? "var(--shell-active-text)" : "var(--shell-text-dim)",
                  background: isActive ? "var(--shell-active-bg)" : "transparent",
                  borderInlineStartColor: isActive ? "var(--shell-accent)" : "transparent",
                  fontWeight: isActive ? 600 : 500,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--shell-text)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "var(--shell-text-dim)";
                }}
              >
                <Icon className="h-[18px] w-[18px] shrink-0" />
                <span className="truncate">{section.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mx-2 mb-1 flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[11px]" style={{ color: "var(--shell-text-dim)" }}>
          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--shell-accent)" }} aria-hidden="true" />
          מרכז שליטה עסקי
        </div>
      </aside>

      {/* Mobile / narrow tablet: horizontal scrollable pill bar instead of a permanent column. */}
      <nav
        className="sticky top-0 z-30 lg:hidden"
        style={{ background: "var(--shell-bg)", borderBottom: "1px solid var(--shell-border)" }}
        aria-label="ניווט ראשי"
      >
        <div className="flex items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-thin">
          {SECTIONS.map((section) => {
            const isActive = active === section.id;
            return (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={clsx("shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors")}
                style={{
                  color: isActive ? "var(--shell-active-text)" : "var(--shell-text-dim)",
                  background: isActive ? "var(--shell-active-bg)" : "transparent",
                }}
              >
                {section.label}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
