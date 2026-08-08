import { categories } from "../data/categories";
import { categoryIcons } from "./ui/Icons";

export function CategoryNav({ activeId }: { activeId?: string }) {
  return (
    <nav className="sticky top-18 z-30 border-b border-[var(--border)] bg-[var(--page)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6" style={{ scrollbarWidth: "none" }}>
        {categories.map((category) => {
          const Icon = categoryIcons[category.icon];
          const isActive = activeId === category.id;
          return (
            <a
              key={category.id}
              href={`#${category.id}`}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-[var(--brand)] bg-[var(--brand)] text-white"
                  : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {category.name}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
