/** Editorial section marker: a large muted index numeral beside the section's title, echoed from SectionNav's labels. */
export function SectionHeading({ index, title, subtitle }: { index: number; title: string; subtitle?: string }) {
  return (
    <div className="flex items-baseline gap-3 px-1">
      <span className="font-serif text-3xl font-bold" style={{ color: "var(--brand-gold-soft)", opacity: 0.6 }} aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>
      <div>
        <h2 className="font-serif text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
        {subtitle && <p className="text-xs text-[var(--text-muted)]">{subtitle}</p>}
      </div>
    </div>
  );
}
