import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";
import { useInView } from "../../hooks/useInView";

/** Fades/slides children in once they scroll into view, instead of animating at mount time (often off-screen). */
export function Reveal({
  children,
  delayMs = 0,
  className,
  id,
  style,
}: {
  children: ReactNode;
  delayMs?: number;
  className?: string;
  id?: string;
  style?: CSSProperties;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      id={id}
      className={clsx("reveal", inView && "is-visible", className)}
      style={{ ...style, transitionDelay: inView ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
