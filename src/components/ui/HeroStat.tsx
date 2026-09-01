import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
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

/** The dashboard's headline number — the anchor of the first three seconds. A real trend chart is woven directly beneath it, not floated off to the side. */
export function HeroStat({
  label,
  value,
  sub,
  delta,
  trend,
  currentMonthKey,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: { pct: number | null; positiveIsGood?: boolean } | null;
  trend?: HeroTrendPoint[];
  currentMonthKey?: string;
}) {
  const gradientId = `hero-area-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const isPositive = delta && delta.pct !== null ? delta.pct >= 0 : null;
  const isGood = isPositive === null ? null : (delta?.positiveIsGood ?? true) ? isPositive : !isPositive;
  const deltaColor = isGood === null ? undefined : isGood ? "var(--success-text)" : "var(--status-critical)";
  const { amount, symbol } = splitCurrency(value);

  return (
    <Card className="animate-fade-up overflow-hidden p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2.5">
            <span className="flex items-baseline text-4xl font-bold tracking-tight text-[var(--brand)] tabular-nums sm:text-[44px]">
              {amount}
              {symbol && <span className="ms-1.5 text-xl font-semibold opacity-45 sm:text-2xl">{symbol}</span>}
            </span>
            {delta && delta.pct !== null && (
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-sm font-semibold tabular-nums"
                style={{ color: deltaColor, background: `color-mix(in oklab, ${deltaColor} 12%, transparent)` }}
              >
                <span className="text-xs">{isPositive ? "▲" : "▼"}</span>
                {Math.abs(delta.pct * 100).toFixed(0)}%
              </span>
            )}
          </div>
          {sub && <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{sub}</p>}
        </div>
      </div>

      {trend && trend.length >= 2 && (
        <div dir="ltr" className="-mx-2 -mb-2 mt-3 h-28 sm:h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
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
              <Tooltip cursor={{ stroke: "var(--baseline)", strokeDasharray: "3 3" }} content={<ChartTooltip formatter={(item) => formatCurrency(Number(item.value))} />} />
              <Area
                type="monotone"
                dataKey="premium"
                name="פרמיה"
                stroke="var(--brand)"
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                dot={(props: { cx?: number; cy?: number; payload?: HeroTrendPoint }) => {
                  const isCurrent = currentMonthKey && props.payload?.monthKey === currentMonthKey;
                  if (!isCurrent || props.cx === undefined || props.cy === undefined) return <g key={props.payload?.monthKey} />;
                  return (
                    <circle
                      key={props.payload?.monthKey}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill="var(--brand)"
                      stroke="var(--surface)"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 4, fill: "var(--brand)", stroke: "var(--surface)", strokeWidth: 2 }}
                animationDuration={700}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
