import clsx from "clsx";
import type { ReactNode } from "react";

const tones = {
  brand: "bg-[var(--brand)] text-white",
  accent: "bg-[var(--accent)] text-[var(--brand-dark)]",
  success: "bg-[var(--success-bg)] text-[var(--success)]",
  danger: "bg-[var(--danger-bg)] text-[var(--danger)]",
  neutral: "bg-[var(--surface-3)] text-[var(--text-secondary)]",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold", tones[tone])}>
      {children}
    </span>
  );
}
