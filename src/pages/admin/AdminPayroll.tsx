import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Wallet, Info } from 'lucide-react';
import { useEmployees } from '../../hooks/useAdminData';
import { usePayrollRules } from '../../hooks/useSettings';
import { buildCompanyMonthReport } from '../../lib/monthlyReport';
import { formatDurationShort, hebrewMonthName } from '../../lib/time';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminPayroll() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data: employees } = useEmployees(false);
  const { data: rules } = usePayrollRules();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['payroll-report', year, month, employees?.length, rules],
    queryFn: () => buildCompanyMonthReport(employees!, year, month, rules!),
    enabled: Boolean(employees && rules),
  });

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  }

  const total = reports?.reduce((sum, r) => sum + (r.estimatedWage ?? 0), 0) ?? 0;

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">שכר</h1>
        <div className="flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900">
          <button onClick={() => shiftMonth(1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
            <ChevronRight className="size-4" />
          </button>
          <span className="min-w-28 text-center text-sm font-bold text-ink-800 dark:text-ink-100">
            {hebrewMonthName(month)} {year}
          </span>
          <button onClick={() => shiftMonth(-1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
            <ChevronLeft className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>האומדן מבוסס על שעות מאושרות וכללי השכר המוגדרים במערכת. הוא אינו מחליף מערכת שכר רשמית או חישוב של רואה חשבון.</p>
      </div>

      <Card className="flex items-center gap-4 px-6 py-5">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-success-50 text-success-600 dark:bg-success-500/10">
          <Wallet className="size-6" />
        </div>
        <div>
          <p className="text-sm text-ink-500 dark:text-ink-400">אומדן שכר כולל לחודש</p>
          <p className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">₪{total.toLocaleString('he-IL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isLoading || !reports ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-brand-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/70 text-xs font-semibold text-ink-500 dark:border-ink-800 dark:bg-ink-800/40 dark:text-ink-400">
                  <th className="px-4 py-3 text-right">עובד</th>
                  <th className="px-4 py-3 text-right">שכר שעתי</th>
                  <th className="px-4 py-3 text-right">שעות רגילות</th>
                  <th className="px-4 py-3 text-right">שעות נוספות</th>
                  <th className="px-4 py-3 text-right">סה״כ שעות</th>
                  <th className="px-4 py-3 text-right">אומדן שכר</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {reports.map((r) => (
                  <tr key={r.employee.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-ink-800 dark:text-ink-100">{r.employee.full_name}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono">{r.employee.hourly_wage ? `₪${r.employee.hourly_wage}` : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono">{formatDurationShort(r.totals.regularMinutes)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono">
                      {formatDurationShort(r.totals.overtimeTier1Minutes + r.totals.overtimeTier2Minutes)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono font-semibold">{formatDurationShort(r.totals.totalMinutes)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono font-bold text-success-600">
                      {r.estimatedWage != null ? `₪${r.estimatedWage.toLocaleString('he-IL', { minimumFractionDigits: 2 })}` : '—'}
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
