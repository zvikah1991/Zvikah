import { useId } from "react";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Card } from "./Card";
import { ChartTooltip } from "../charts/ChartTooltip";
import { formatCurrency, formatMonthKeyShort } from "../../lib/format";

export interface HeroTrendPoint {
  monthKey: string;
  premium: number;
}

/** Splits a formatted "₪X,XXX" string so the currency symbol can render smaller/lighter than the digits. */
function splitCurrency(formatted: string): { amount: string; symbol: string } {
  const symbol = formatted.match(/₪/)?.[0] ?? "";
  const amount = formatted.replace(/[₪‎‏]/g, "").trim();
  return { amount, symbol };
}

/**
 * The dashboard's headline module — "Revenue Pulse". One composed surface that carries the
 * current premium, its month-over-month movement, the supporting deal-count / average-deal
 * figures, and the trend that produced it — instead of a number floating alone in a large
 * empty card. This is the anchor of the first three seconds on the page.
 */
export function RevenueHero({
  label,
  value,
  delta,
  periodLabel,
  dealsLabel,
  avgLabel,
  trend,
  currentMonthKey,
  previousMonthPremium,
}: {
  label: string;
  value: string;
  delta?: { pct: number | null; positiveIsGood?: boolean } | null;
  periodLabel?: string;
  dealsLabel?: string;
  avgLabel?: string;
  trend?: HeroTrendPoint[];
  currentMonthKey?: string;
  previousMonthPremium?: number | null;
}) {
  const gradientId = `hero-area-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const isPositive = delta && delta.pct !== null ? delta.pct >= 0 : null;
  const isGood = isPositive === null ? null : (delta?.positiveIsGood ?? true) ? isPositive : !isPositive;
  const deltaColor = isGood === null ? undefined : isGood ? "var(--success-text)" : "var(--status-critical)";
  const { amount, symbol } = splitCurrency(value);

  return (
    <Card
      className="animate-fade-up flex h-full flex-col overflow-hidden p-6 sm:p-7"
      style={{
        boxShadow: "var(--shadow-md)",
        background: "linear-gradient(165deg, color-mix(in oklab, var(--electric) 5%, var(--surface)) 0%, var(--surface) 45%)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase">{label}</p>
        {periodLabel && (
          <span className="rounded-full bg-[var(--surface-2)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--text-secondary)]">{periodLabel}</span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-3">
        <span className="flex items-baseline text-[42px] leading-none font-bold tracking-tight text-[var(--brand-strong)] tabular-nums sm:text-[56px]">
          {amount}
          {symbol && <span className="ms-2 text-2xl font-semibold opacity-40 sm:text-3xl">{symbol}</span>}
        </span>
        {delta && delta.pct !== null && (
          <span
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-semibold tabular-nums"
            style={{ color: deltaColor, background: `color-mix(in oklab, ${deltaColor} 12%, transparent)` }}
          >
            <span className="text-xs">{isPositive ? "▲" : "▼"}</span>
            {Math.abs(delta.pct * 100).toFixed(0)}%
          </span>
        )}
      </div>

      {(dealsLabel || avgLabel) && (
        <div className="mt-4 flex items-center gap-5 border-t border-[var(--border)] pt-4 text-sm">
          {dealsLabel && (
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">{dealsLabel}</span>
              <span className="text-xs text-[var(--text-muted)]">עסקאות</span>
            </div>
          )}
          {dealsLabel && avgLabel && <span className="h-3 w-px bg-[var(--border)]" aria-hidden="true" />}
          {avgLabel && (
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold tabular-nums text-[var(--text-primary)]">{avgLabel}</span>
              <span className="text-xs text-[var(--text-muted)]">ממוצע לעסקה</span>
            </div>
          )}
        </div>
      )}

      {trend && trend.length >= 2 && (
        <div className="mt-auto flex flex-col pt-5">
          <div className="mb-1 flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--electric)" }} aria-hidden="true" />
            מגמת {trend.length} חודשים אחרונים
          </div>
          <div dir="ltr" className="-mx-2 -mb-2 h-40 sm:h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--electric)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--electric)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="monthKey"
                  tickFormatter={formatMonthKeyShort}
                  tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                  axisLine={{ stroke: "var(--baseline)" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                {previousMonthPremium !== null && previousMonthPremium !== undefined && (
                  <ReferenceLine y={previousMonthPremium} stroke="var(--baseline)" strokeDasharray="3 3" ifOverflow="extendDomain" />
                )}
                <Tooltip cursor={{ stroke: "var(--baseline)", strokeDasharray: "3 3" }} content={<ChartTooltip formatter={(item) => formatCurrency(Number(item.value))} />} />
                <Area
                  type="monotone"
                  dataKey="premium"
                  name="פרמיה"
                  stroke="var(--electric)"
                  strokeWidth={2.5}
                  fill={`url(#${gradientId})`}
                  dot={(props: { cx?: number; cy?: number; payload?: HeroTrendPoint }) => {
                    const isCurrent = currentMonthKey && props.payload?.monthKey === currentMonthKey;
                    if (!isCurrent || props.cx === undefined || props.cy === undefined) return <g key={props.payload?.monthKey} />;
                    return (
                      <g key={props.payload?.monthKey}>
                        <circle cx={props.cx} cy={props.cy} r={9} fill="var(--electric)" opacity={0.14} />
                        <circle cx={props.cx} cy={props.cy} r={4.5} fill="var(--electric)" stroke="var(--surface)" strokeWidth={2} />
                      </g>
                    );
                  }}
                  activeDot={{ r: 4.5, fill: "var(--electric)", stroke: "var(--surface)", strokeWidth: 2 }}
                  animationDuration={700}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}
