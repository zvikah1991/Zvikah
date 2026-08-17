import { useEffect, useState } from "react";
import clsx from "clsx";

const SECTIONS = [
  { id: "overview", label: "סקירה כללית" },
  { id: "trends", label: "מגמות ופילוחים" },
  { id: "leaderboard", label: "לוח מובילים" },
  { id: "activity", label: "פעילות אחרונה" },
  { id: "customers", label: "לקוחות" },
  { id: "deals", label: "כל העסקאות" },
];

export function SectionNav() {
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
    <nav className="sticky top-[71px] z-20 border-b border-[var(--border)] bg-[var(--page)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto scrollbar-thin px-4 sm:px-6">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => scrollToSection(section.id)}
            className={clsx(
              "relative shrink-0 whitespace-nowrap px-3 py-2.5 text-sm transition-colors",
              active === section.id ? "font-medium text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            )}
          >
            {section.label}
            {active === section.id && (
              <span
                className="absolute inset-x-2 bottom-0 h-[2px] rounded-full"
                style={{ background: "linear-gradient(90deg, var(--brand), var(--brand-gold))" }}
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
