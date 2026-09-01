/** Section marker for the main content column — orientation while scrolling, echoing the sidebar's active label. */
export function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="px-1">
      <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-[var(--text-muted)]">{subtitle}</p>}
    </div>
  );
}
