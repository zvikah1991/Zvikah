import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, UserCheck, Clock, AlertTriangle, Inbox } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useEmployees, useLiveEmployees, usePendingCounts } from '../../hooks/useAdminData';
import { usePayrollRules } from '../../hooks/useSettings';
import { fetchEmployeeMonthData, buildMonthlyRows } from '../../lib/reportData';
import { formatDurationLong, formatDurationShort, formatTimeHe } from '../../lib/time';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';

function KpiCard({ icon: Icon, label, value, tone = 'default' }: { icon: typeof Users; label: string; value: string | number; tone?: 'default' | 'danger' | 'warning' }) {
  const toneClasses = {
    default: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
    danger: 'bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-500',
  }[tone];

  return (
    <Card className="animate-slide-up px-5 py-4">
      <div className="flex items-center gap-3.5">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${toneClasses}`}>
          <Icon className="size-5.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink-500 dark:text-ink-400">{label}</p>
          <p className="text-xl font-extrabold text-ink-900 dark:text-ink-50">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export default function AdminDashboard() {
  const { data: liveEmployees, isLoading: liveLoading } = useLiveEmployees();
  const { data: allEmployees } = useEmployees(false);
  const { data: pending } = usePendingCounts();
  const { data: rules } = usePayrollRules();

  const now = new Date();

  const { data: monthTotalMinutes } = useQuery({
    queryKey: ['dashboard-month-total', now.getFullYear(), now.getMonth() + 1, allEmployees?.length, rules],
    queryFn: async () => {
      if (!allEmployees || !rules) return 0;
      const results = await Promise.all(
        allEmployees.map((e) => fetchEmployeeMonthData(e.id, now.getFullYear(), now.getMonth() + 1)),
      );
      return results.reduce((sum, data) => sum + buildMonthlyRows(now.getFullYear(), now.getMonth() + 1, data, rules).totals.totalMinutes, 0);
    },
    enabled: Boolean(allEmployees && rules),
  });

  const { data: monthLock } = useQuery({
    queryKey: ['month-lock-status', now.getFullYear(), now.getMonth() + 1],
    queryFn: async () => {
      const { data } = await supabase
        .from('monthly_locks')
        .select('*')
        .eq('year', now.getFullYear())
        .eq('month', now.getMonth() + 1)
        .maybeSingle();
      return data;
    },
  });

  const workingCount = useMemo(() => liveEmployees?.filter((e) => e.status === 'working' || e.status === 'break').length ?? 0, [liveEmployees]);
  const missingCount = useMemo(() => liveEmployees?.filter((e) => e.status === 'missing').length ?? 0, [liveEmployees]);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">לוח בקרה</h1>
          <p className="text-sm text-ink-500 dark:text-ink-400">
            {now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        {monthLock?.locked === false && (
          <Link to="/admin/reports" className="rounded-xl bg-warning-50 px-3.5 py-2 text-sm font-semibold text-warning-600 dark:bg-warning-500/10">
            החודש הנוכחי טרם נסגר
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <KpiCard icon={UserCheck} label="עובדים כרגע בעבודה" value={workingCount} />
        <KpiCard icon={Users} label="סה״כ עובדים" value={allEmployees?.length ?? '—'} />
        <KpiCard icon={Clock} label="שעות עבודה החודש" value={monthTotalMinutes != null ? formatDurationShort(monthTotalMinutes) : '—'} />
        <KpiCard icon={AlertTriangle} label="דיווחים חסרים" value={missingCount} tone={missingCount > 0 ? 'danger' : 'default'} />
        <KpiCard
          icon={Inbox}
          label="בקשות ממתינות"
          value={(pending?.corrections ?? 0) + (pending?.absences ?? 0)}
          tone={(pending?.corrections ?? 0) + (pending?.absences ?? 0) > 0 ? 'warning' : 'default'}
        />
      </div>

      <Card>
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800">
          <h2 className="font-bold text-ink-900 dark:text-ink-50">עובדים בזמן אמת</h2>
          <Link to="/admin/attendance" className="text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400">
            צפייה בכל הנוכחות
          </Link>
        </div>

        {liveLoading ? (
          <div className="flex justify-center py-14">
            <Spinner className="text-brand-600" />
          </div>
        ) : !liveEmployees?.length ? (
          <EmptyState icon={Users} title="אין עובדים פעילים" description="הוסף עובדים דרך מסך העובדים" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/70 text-xs font-semibold text-ink-500 dark:border-ink-800 dark:bg-ink-800/40 dark:text-ink-400">
                  <th className="px-5 py-3 text-right">שם</th>
                  <th className="px-5 py-3 text-right">סטטוס</th>
                  <th className="px-5 py-3 text-right">שעת כניסה</th>
                  <th className="px-5 py-3 text-right">זמן עבודה היום</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {liveEmployees.map((row) => (
                  <tr key={row.profile.id}>
                    <td className="px-5 py-3 font-semibold text-ink-800 dark:text-ink-100">{row.profile.full_name}</td>
                    <td className="px-5 py-3">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-5 py-3 font-mono text-ink-600 dark:text-ink-300">{formatTimeHe(row.clockIn)}</td>
                    <td className="px-5 py-3 font-mono text-ink-600 dark:text-ink-300">
                      {row.elapsedMinutes > 0 ? formatDurationLong(row.elapsedMinutes) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
