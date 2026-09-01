/** Section marker for the main content column — a small signature accent bar shared with SectionTitle, for orientation while scrolling. */
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <span className="h-5 w-1 shrink-0 rounded-full bg-[var(--brand)]" aria-hidden="true" />
      <div>
        <h2 className="text-[17px] font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
      </div>
    </div>
  );
}
