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
      className={clsx("relative rounded-2xl border bg-[var(--surface)] border-[var(--border)]", "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]", className)}
      style={style}
    >
      {children}
    </div>
  );
}
