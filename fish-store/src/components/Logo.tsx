import { FishIcon } from "./ui/Icons";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[var(--text-on-brand)] shadow-sm"
        style={{ background: "linear-gradient(135deg, var(--brand), var(--brand-light))" }}
      >
        <FishIcon className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-lg font-extrabold tracking-tight text-[var(--text-primary)]">
            ויוסי דגים
          </span>
          <span className="mt-0.5 text-[11px] font-medium tracking-wide text-[var(--accent-dark)]">
            טרי מהים אליכם
          </span>
        </span>
      )}
    </div>
  );
}
