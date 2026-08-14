import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, FileSpreadsheet, FileText, Lock, LockOpen, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useEmployees } from '../../hooks/useAdminData';
import { usePayrollRules, useCompanyInfo } from '../../hooks/useSettings';
import { buildCompanyMonthReport, type EmployeeMonthReport } from '../../lib/monthlyReport';
import { STATUS_LABEL } from '../../lib/reportData';
import { exportCompanySummaryExcel, exportCompanySummaryPdf, exportEmployeeDetailExcel, exportEmployeeDetailPdf } from '../../lib/reportExport';
import { formatDurationShort, formatTimeHe, hebrewMonthName } from '../../lib/time';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';

export default function AdminReports() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [exportBusy, setExportBusy] = useState<string | null>(null);

  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: employees } = useEmployees(false);
  const { data: rules } = usePayrollRules();
  const { data: company } = useCompanyInfo();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['company-report', year, month, employees?.length, rules],
    queryFn: () => buildCompanyMonthReport(employees!, year, month, rules!),
    enabled: Boolean(employees && rules),
  });

  const { data: lock } = useQuery({
    queryKey: ['month-lock', year, month],
    queryFn: async () => {
      const { data } = await supabase.from('monthly_locks').select('*').eq('year', year).eq('month', month).maybeSingle();
      return data;
    },
  });

  const lockMutation = useMutation({
    mutationFn: async () => {
      const fn = lock?.locked ? 'reopen_month' : 'close_month';
      const { error } = await supabase.rpc(fn, { p_year: year, p_month: month });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(lock?.locked ? 'החודש נפתח לעריכה' : 'החודש ננעל בהצלחה');
      queryClient.invalidateQueries({ queryKey: ['month-lock', year, month] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  }

  async function handleExport(kind: 'summary-xlsx' | 'summary-pdf' | 'detail-xlsx' | 'detail-pdf', report?: EmployeeMonthReport) {
    if (!reports || !company) return;
    setExportBusy(kind + (report?.employee.id ?? ''));
    try {
      if (kind === 'summary-xlsx') await exportCompanySummaryExcel(company.name, year, month, reports);
      if (kind === 'summary-pdf') await exportCompanySummaryPdf(company.name, year, month, reports);
      if (kind === 'detail-xlsx' && report) await exportEmployeeDetailExcel(company.name, year, month, report);
      if (kind === 'detail-pdf' && report) await exportEmployeeDetailPdf(company.name, year, month, report);
      toast.success('הקובץ הופק בהצלחה');
    } catch {
      toast.error('הפקת הקובץ נכשלה');
    } finally {
      setExportBusy(null);
    }
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">דוח חודשי לרואה חשבון</h1>
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

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" loading={exportBusy === 'summary-xlsx'} onClick={() => handleExport('summary-xlsx')} disabled={!reports}>
          <FileSpreadsheet className="size-4" />
          הורדה ל-Excel
        </Button>
        <Button variant="secondary" loading={exportBusy === 'summary-pdf'} onClick={() => handleExport('summary-pdf')} disabled={!reports}>
          <FileText className="size-4" />
          הורדה ל-PDF
        </Button>
        <Button
          variant={lock?.locked ? 'secondary' : 'primary'}
          loading={lockMutation.isPending}
          onClick={() => lockMutation.mutate()}
          className="mr-auto"
        >
          {lock?.locked ? (
            <>
              <LockOpen className="size-4" />
              פתיחת חודש מחדש
            </>
          ) : (
            <>
              <Lock className="size-4" />
              אישור וסגירת חודש
            </>
          )}
        </Button>
      </div>

      {lock?.locked && (
        <div className="rounded-xl bg-ink-100 px-4 py-2.5 text-sm font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300">
          החודש נעול לעריכה{lock.locked_at ? ` מאז ${new Date(lock.locked_at).toLocaleDateString('he-IL')}` : ''}
        </div>
      )}

      <Card className="overflow-hidden">
        {isLoading || !reports ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-brand-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/70 text-xs font-semibold text-ink-500 dark:border-ink-800 dark:bg-ink-800/40 dark:text-ink-400">
                  <th className="px-4 py-3 text-right" />
                  <th className="px-4 py-3 text-right">שם עובד</th>
                  <th className="px-4 py-3 text-right">ימי עבודה</th>
                  <th className="px-4 py-3 text-right">שעות רגילות</th>
                  <th className="px-4 py-3 text-right">שעות נוספות</th>
                  <th className="px-4 py-3 text-right">חופשה</th>
                  <th className="px-4 py-3 text-right">מחלה</th>
                  <th className="px-4 py-3 text-right">היעדרויות</th>
                  <th className="px-4 py-3 text-right">סה״כ שעות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {reports.map((r) => (
                  <>
                    <tr key={r.employee.id} className="cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-800/40" onClick={() => setExpanded(expanded === r.employee.id ? null : r.employee.id)}>
                      <td className="px-4 py-2.5">
                        <ChevronDown className={`size-4 text-ink-400 transition-transform ${expanded === r.employee.id ? 'rotate-180' : ''}`} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-ink-800 dark:text-ink-100">{r.employee.full_name}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">{r.totals.workDays}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono">{formatDurationShort(r.totals.regularMinutes)}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono">
                        {formatDurationShort(r.totals.overtimeTier1Minutes + r.totals.overtimeTier2Minutes)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">{r.vacationDays}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">{r.sickDays}</td>
                      <td className="whitespace-nowrap px-4 py-2.5">{r.otherAbsenceDays}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-mono font-bold">{formatDurationShort(r.totals.totalMinutes)}</td>
                    </tr>
                    {expanded === r.employee.id && (
                      <tr>
                        <td colSpan={9} className="bg-ink-50/60 px-4 py-4 dark:bg-ink-800/20">
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-sm font-bold text-ink-700 dark:text-ink-200">פירוט יומי</p>
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" loading={exportBusy === 'detail-xlsx' + r.employee.id} onClick={() => handleExport('detail-xlsx', r)}>
                                <FileSpreadsheet className="size-3.5" />
                                Excel
                              </Button>
                              <Button size="sm" variant="secondary" loading={exportBusy === 'detail-pdf' + r.employee.id} onClick={() => handleExport('detail-pdf', r)}>
                                <FileText className="size-3.5" />
                                PDF
                              </Button>
                            </div>
                          </div>
                          <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white dark:border-ink-700 dark:bg-ink-900">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-ink-100 text-ink-500 dark:border-ink-800 dark:text-ink-400">
                                  <th className="px-3 py-2 text-right">תאריך</th>
                                  <th className="px-3 py-2 text-right">יום</th>
                                  <th className="px-3 py-2 text-right">כניסה</th>
                                  <th className="px-3 py-2 text-right">יציאה</th>
                                  <th className="px-3 py-2 text-right">שעות</th>
                                  <th className="px-3 py-2 text-right">סטטוס</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                                {r.rows
                                  .filter((row) => row.status !== 'future')
                                  .map((row) => (
                                    <tr key={row.date}>
                                      <td className="whitespace-nowrap px-3 py-1.5">{row.date.split('-').slice(1).reverse().join('/')}</td>
                                      <td className="whitespace-nowrap px-3 py-1.5 text-ink-500">{row.dayName}</td>
                                      <td className="whitespace-nowrap px-3 py-1.5 font-mono">{formatTimeHe(row.clockIn)}</td>
                                      <td className="whitespace-nowrap px-3 py-1.5 font-mono">{formatTimeHe(row.clockOut)}</td>
                                      <td className="whitespace-nowrap px-3 py-1.5 font-mono font-semibold">
                                        {row.computation.workedMinutes > 0 ? formatDurationShort(row.computation.workedMinutes) : '—'}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-1.5">
                                        <Badge tone={row.status === 'missing' ? 'danger' : row.status === 'worked' ? 'success' : 'gray'}>
                                          {STATUS_LABEL[row.status]}
                                        </Badge>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
