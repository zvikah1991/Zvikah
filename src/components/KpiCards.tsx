import { useMemo, useRef, useState } from "react";
import type { SalesRecord } from "../types";
import { computeKpis, monthlyTrend, monthOverMonth, monthlyPaceProjection } from "../lib/aggregations";
import { statusBucket } from "../lib/statusBuckets";
import { formatCurrency, formatMonthKeyShort, formatNumber, formatPercent } from "../lib/format";
import { useCountUp } from "../hooks/useCountUp";
import { loadKpiOrder, saveKpiOrder } from "../lib/storage";
import { StatTile } from "./ui/StatTile";
import { IconBriefcase, IconCheck, IconClock, IconCoins, IconGripDots, IconRotateCcw, IconTarget, IconTrendingUp, IconUsers, IconX } from "./ui/Icons";
import clsx from "clsx";

type TileId = "deals" | "avgPremium" | "customers" | "completed" | "cancelled" | "inProgress" | "pace" | "current";

const DEFAULT_ORDER: TileId[] = ["deals", "avgPremium", "customers", "completed", "cancelled", "inProgress", "pace", "current"];

function mergeOrder(saved: string[], fallback: TileId[]): TileId[] {
  const known = new Set(fallback);
  const cleaned = saved.filter((id): id is TileId => known.has(id as TileId));
  for (const id of fallback) if (!cleaned.includes(id)) cleaned.push(id);
  return cleaned;
}

export function KpiCards({ filtered, filteredIgnoringDate }: { filtered: SalesRecord[]; filteredIgnoringDate: SalesRecord[] }) {
  const kpis = useMemo(() => computeKpis(filtered, statusBucket), [filtered]);
  const mom = useMemo(() => monthOverMonth(filteredIgnoringDate), [filteredIgnoringDate]);
  const comparison = mom && mom.previousLabel ? mom : null;
  const pace = useMemo(() => monthlyPaceProjection(filteredIgnoringDate), [filteredIgnoringDate]);

  const premium = useCountUp(kpis.totalPremium);
  const deals = useCountUp(kpis.totalDeals);
  const avg = useCountUp(kpis.avgPremium);
  const customers = useCountUp(kpis.distinctCustomers);
  const winRate = useCountUp(kpis.winRate * 100);
  const projected = useCountUp(pace?.projectedPremium ?? 0);
  const goodPremium = useCountUp(kpis.goodPremium);

  const premiumTrend = useMemo(() => monthlyTrend(filteredIgnoringDate).slice(-8).map((p) => p.premium), [filteredIgnoringDate]);

  const [order, setOrder] = useState<TileId[]>(() => {
    const saved = loadKpiOrder();
    return saved ? mergeOrder(saved, DEFAULT_ORDER) : DEFAULT_ORDER;
  });
  const [draggedId, setDraggedId] = useState<TileId | null>(null);
  const orderRef = useRef(order);
  orderRef.current = order;

  const isCustomOrder = order.join(",") !== DEFAULT_ORDER.join(",");

  const reorder = (targetId: TileId) => {
    setOrder((prev) => {
      if (!draggedId || draggedId === targetId) return prev;
      const from = prev.indexOf(draggedId);
      const to = prev.indexOf(targetId);
      if (from === -1 || to === -1 || from === to) return prev;
      const next = [...prev];
      next.splice(from, 1);
      next.splice(to, 0, draggedId);
      return next;
    });
  };

  const commitOrder = () => {
    setDraggedId(null);
    saveKpiOrder(orderRef.current);
  };

  const resetOrder = () => {
    setOrder(DEFAULT_ORDER);
    saveKpiOrder(DEFAULT_ORDER);
  };

  const tiles: Partial<Record<TileId, { render: (delayMs: number) => React.ReactNode; className?: string }>> = {
    deals: {
      render: (delayMs) => (
        <StatTile
          label="עסקאות"
          value={formatNumber(Math.round(deals))}
          icon={<IconBriefcase />}
          accentColor="var(--series-7)"
          delta={comparison ? { pct: comparison.countDeltaPct } : undefined}
          sub={comparison ? `${formatMonthKeyShort(comparison.currentLabel)} לעומת ${formatMonthKeyShort(comparison.previousLabel)}` : undefined}
          delayMs={delayMs}
        />
      ),
    },
    avgPremium: {
      render: (delayMs) => (
        <StatTile label="פרמיה ממוצעת לעסקה" value={formatCurrency(avg)} icon={<IconTarget />} accentColor="var(--series-2)" delayMs={delayMs} />
      ),
    },
    customers: {
      render: (delayMs) => (
        <StatTile
          label="לקוחות ייחודיים"
          value={formatNumber(Math.round(customers))}
          icon={<IconUsers />}
          accentColor="var(--series-3)"
          delayMs={delayMs}
        />
      ),
    },
    completed: {
      render: (delayMs) => (
        <StatTile
          label="הופק / הושלם"
          value={formatNumber(kpis.goodCount)}
          icon={<IconCheck />}
          accentColor="var(--status-good)"
          sub={`${formatCurrency(goodPremium)} פרמיה שהופקה · ${formatPercent(winRate / 100)} אחוז הצלחה`}
          delayMs={delayMs}
        />
      ),
    },
    cancelled: {
      render: (delayMs) => (
        <StatTile
          label="בוטל / נדחה"
          value={formatNumber(kpis.criticalCount)}
          icon={<IconX />}
          accentColor="var(--status-critical)"
          delayMs={delayMs}
        />
      ),
    },
    inProgress: {
      render: (delayMs) => (
        <StatTile
          label="בטיפול"
          value={formatNumber(kpis.warningCount)}
          icon={<IconClock />}
          accentColor="var(--status-warning)"
          delayMs={delayMs}
        />
      ),
    },
    current: {
      render: (delayMs) => (
        <StatTile
          label="פרמיה נוכחית"
          value={formatCurrency(premium)}
          icon={<IconCoins />}
          accentColor="var(--series-1)"
          delta={comparison ? { pct: comparison.premiumDeltaPct } : undefined}
          sub={comparison ? `${formatMonthKeyShort(comparison.currentLabel)} לעומת ${formatMonthKeyShort(comparison.previousLabel)}` : "לפי הסינון הנוכחי"}
          sparkline={premiumTrend}
          delayMs={delayMs}
        />
      ),
      className: "col-span-2 sm:col-span-1",
    },
  };

  if (pace) {
    tiles.pace = {
      render: (delayMs) => (
        <StatTile
          label="פרמיה צפויה לפי קצב החודש"
          value={formatCurrency(projected)}
          icon={<IconTrendingUp />}
          accentColor="var(--status-good)"
          delta={pace.previousMonthLabel ? { pct: pace.growthPct } : undefined}
          sub={
            pace.previousMonthLabel
              ? `לעומת אותה נקודה ב${formatMonthKeyShort(pace.previousMonthLabel)} · ${pace.daysElapsed} מתוך ${pace.daysInMonth} ימי עבודה`
              : pace.isProjecting
                ? `הערכה לפי ${pace.daysElapsed} מתוך ${pace.daysInMonth} ימי עבודה · ${formatMonthKeyShort(pace.monthLabel)}`
                : `${formatMonthKeyShort(pace.monthLabel)} הסתיים — זהה לבפועל`
          }
          progress={pace.daysInMonth > 0 ? pace.daysElapsed / pace.daysInMonth : undefined}
          delayMs={delayMs}
        />
      ),
    };
  }

  const renderOrder = order.filter((id) => tiles[id]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
        {renderOrder.map((id, i) => {
          const tile = tiles[id]!;
          return (
            <div
              key={id}
              draggable
              onDragStart={(e) => {
                setDraggedId(id);
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                reorder(id);
              }}
              onDrop={(e) => {
                e.preventDefault();
                commitOrder();
              }}
              onDragEnd={commitOrder}
              className={clsx(
                "group relative cursor-grab transition-opacity active:cursor-grabbing",
                draggedId === id && "opacity-40",
                tile.className,
              )}
              title="גררו כדי לשנות סדר"
            >
              <span className="pointer-events-none absolute bottom-2 end-2 z-10 text-[var(--text-muted)] opacity-0 transition-opacity group-hover:opacity-60">
                <IconGripDots />
              </span>
              {tile.render(i * 50)}
            </div>
          );
        })}
      </div>
      {isCustomOrder && (
        <button
          type="button"
          onClick={resetOrder}
          className="flex w-fit items-center gap-1 self-start rounded-md px-1.5 py-1 text-xs text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-secondary)]"
        >
          <IconRotateCcw className="h-3 w-3" />
          איפוס סדר הכרטיסים
        </button>
      )}
    </div>
  );
}
