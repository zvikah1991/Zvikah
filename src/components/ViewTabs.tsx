import clsx from "clsx";
import { IconBriefcase, IconMegaphone } from "./ui/Icons";

export type AppView = "sales" | "ads";

const TABS: { id: AppView; label: string; icon: React.ReactNode }[] = [
  { id: "sales", label: "דשבורד מכירות", icon: <IconBriefcase className="h-4 w-4" /> },
  { id: "ads", label: "קמפיין גוגל אדס", icon: <IconMegaphone className="h-4 w-4" /> },
];

export function ViewTabs({ view, onChange }: { view: AppView; onChange: (v: AppView) => void }) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--page)]">
      <div className="mx-auto flex max-w-[1400px] items-center gap-1 px-4 py-1.5 sm:px-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors",
              view === tab.id
                ? "bg-[var(--surface-2)] font-medium text-[var(--text-primary)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
