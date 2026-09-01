import type { ReactNode } from "react";
import clsx from "clsx";

/** The single surface primitive every panel, chart and table sits on — a clean white card with a hairline border and a light shadow. */
export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={clsx("relative rounded-2xl border border-[var(--border)] bg-[var(--surface)]", className)}
      style={{ boxShadow: "var(--shadow-sm)", ...style }}
    >
      {children}
    </div>
  );
}
