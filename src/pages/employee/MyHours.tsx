import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePayrollRules } from '../../hooks/useSettings';
import { fetchEmployeeMonthData, buildMonthlyRows, STATUS_LABEL } from '../../lib/reportData';
import { formatDurationLong, formatDurationShort, formatTimeHe, hebrewMonthName } from '../../lib/time';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

const STATUS_TONE: Record<string, 'success' | 'gray' | 'warning' | 'danger' | 'brand'> = {
  worked: 'success',
  vacation: 'brand',
  sick: 'warning',
  military: 'brand',
  holiday: 'brand',
  other_absence: 'gray',
  missing: 'danger',
  weekend: 'gray',
  future: 'gray',
};

export default function MyHours() {
  const { session } = useAuth();
  const { data: rules } = usePayrollRules();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const employeeId = session?.user.id;

  const { data, isLoading } = useQuery({
    queryKey: ['my-hours', employeeId, year, month],
    queryFn: () => fetchEmployeeMonthData(employeeId!, year, month),
    enabled: Boolean(employeeId),
  });

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  }

  const result = data && rules ? buildMonthlyRows(year, month, data, rules) : null;

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">השעות שלי</h1>
        <div className="flex items-center gap-1 rounded-xl border border-ink-200 bg-white p-1 dark:border-ink-800 dark:bg-ink-900">
          <button onClick={() => shiftMonth(1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
            <ChevronRight className="size-4" />
          </button>
          <span className="min-w-24 text-center text-sm font-bold text-ink-800 dark:text-ink-100">
            {hebrewMonthName(month)} {year}
          </span>
          <button onClick={() => shiftMonth(-1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800">
            <ChevronLeft className="size-4" />
          </button>
        </div>
      </div>

      {isLoading || !result ? (
        <div className="flex justify-center py-16">
          <Spinner className="size-7 text-brand-600" />
        </div>
      ) : (
        <>
          <Card>
            <div className="grid grid-cols-2 divide-x divide-x-reverse divide-ink-100 dark:divide-ink-800 sm:grid-cols-4">
              <Stat label="סה״כ שעות" value={formatDurationLong(result.totals.totalMinutes)} />
              <Stat label="ימי עבודה" value={String(result.totals.workDays)} />
              <Stat label="שעות נוספות" value={formatDurationShort(result.totals.overtimeTier1Minutes + result.totals.overtimeTier2Minutes)} />
              <Stat label="דיווחים חסרים" value={String(result.missingDays)} danger={result.missingDays > 0} />
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <SmallStat label="ימי חופשה" value={result.vacationDays} />
            <SmallStat label="ימי מחלה" value={result.sickDays} />
            <SmallStat label="שעות רגילות" value={formatDurationShort(result.totals.regularMinutes)} />
          </div>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 bg-ink-50/70 text-xs font-semibold text-ink-500 dark:border-ink-800 dark:bg-ink-800/40 dark:text-ink-400">
                    <th className="px-4 py-3 text-right">תאריך</th>
                    <th className="px-4 py-3 text-right">יום</th>
                    <th className="px-4 py-3 text-right">כניסה</th>
                    <th className="px-4 py-3 text-right">יציאה</th>
                    <th className="px-4 py-3 text-right">הפסקה</th>
                    <th className="px-4 py-3 text-right">שעות עבודה</th>
                    <th className="px-4 py-3 text-right">סטטוס</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                  {result.rows.map((row) => (
                    <tr key={row.date} className={row.status === 'future' ? 'opacity-40' : ''}>
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-ink-700 dark:text-ink-200">
                        {row.date.split('-').slice(1).reverse().join('/')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-ink-500 dark:text-ink-400">{row.dayName}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-ink-700 dark:text-ink-200">{formatTimeHe(row.clockIn)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-ink-700 dark:text-ink-200">{formatTimeHe(row.clockOut)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono text-ink-500 dark:text-ink-400">
                        {row.breakMinutes > 0 ? formatDurationShort(row.breakMinutes) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono font-semibold text-ink-800 dark:text-ink-100">
                        {row.computation.workedMinutes > 0 ? formatDurationShort(row.computation.workedMinutes) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="px-4 py-4 text-center first:pr-4 sm:first:pr-6">
      <p className={`text-xl font-extrabold ${danger ? 'text-danger-600' : 'text-ink-900 dark:text-ink-50'}`}>{value}</p>
      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{label}</p>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="px-4 py-3 text-center">
      <p className="text-lg font-extrabold text-ink-900 dark:text-ink-50">{value}</p>
      <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">{label}</p>
    </Card>
  );
}
