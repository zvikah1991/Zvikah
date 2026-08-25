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
      className={clsx("relative rounded-2xl border border-[var(--border)]", className)}
      style={{
        background: "color-mix(in oklab, var(--surface) 80%, transparent)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:
          "inset 0 1px 0 color-mix(in oklab, white 30%, transparent), 0 1px 2px rgba(0,0,0,0.05), 0 24px 48px -20px rgba(0,0,0,0.28)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
