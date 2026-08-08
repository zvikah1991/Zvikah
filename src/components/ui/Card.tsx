import type { ReactNode } from "react";
import clsx from "clsx";

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
      className={clsx(
        "rounded-2xl border bg-[var(--surface)] border-[var(--border)] shadow-sm",
        "shadow-black/[0.03]",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}
