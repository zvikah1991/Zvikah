import { useRef, type ReactNode } from "react";
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
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    el.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={clsx("group relative rounded-2xl border border-[var(--border)]", className)}
      style={{
        background: "color-mix(in oklab, var(--surface) 80%, transparent)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:
          "inset 0 1px 0 color-mix(in oklab, white 30%, transparent), 0 1px 2px rgba(0,0,0,0.05), 0 24px 48px -20px rgba(0,0,0,0.28)",
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        className="spotlight-overlay pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          background: "radial-gradient(480px circle at var(--mx, 50%) var(--my, 50%), color-mix(in oklab, var(--spotlight) 30%, transparent), transparent 65%)",
        }}
      />
      {children}
    </div>
  );
}
