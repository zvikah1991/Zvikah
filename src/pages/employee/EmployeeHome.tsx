import { useEffect, useState } from 'react';
import { LogIn, LogOut, Coffee, PlayCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMyOpenAttendance, useLiveElapsedMinutes, rpcClockIn, rpcClockOut, rpcStartBreak, rpcEndBreak } from '../../hooks/useMyAttendance';
import { useTodayAttendance } from '../../hooks/useTodayAttendance';
import { usePayrollRules } from '../../hooks/useSettings';
import { computeDay, computeBreakMinutes } from '../../lib/payroll';
import { formatDurationLong, formatDurationShort, formatTimeHe } from '../../lib/time';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center">
      <p className="font-mono text-4xl font-extrabold tracking-tight text-ink-900 dark:text-ink-50">
        {now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
        {now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  );
}

export default function EmployeeHome() {
  const { profile, session } = useAuth();
  const { data: openState, isLoading, invalidate } = useMyOpenAttendance();
  const { data: todayRows } = useTodayAttendance(session?.user.id);
  const { data: rules } = usePayrollRules();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const attendance = openState?.attendance ?? null;
  const openBreak = openState?.openBreak ?? null;

  const workElapsed = useLiveElapsedMinutes(attendance && !openBreak ? attendance.clock_in : null);
  const breakElapsed = useLiveElapsedMinutes(openBreak?.break_start ?? null);

  const todayTotalMinutes =
    todayRows && rules
      ? todayRows.reduce((sum, row) => sum + computeDay(row, row.breaks, rules).workedMinutes, 0)
      : 0;

  const previousBreaksMinutes = attendance ? computeBreakMinutes((todayRows?.find((r) => r.id === attendance.id)?.breaks) ?? []) : 0;

  async function withBusy(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'שגיאה');
    } finally {
      setBusy(false);
    }
  }

  const handleClockIn = () =>
    withBusy(async () => {
      await rpcClockIn();
      await invalidate();
      toast.success('בוצעה כניסה לעבודה בהצלחה');
    });

  const handleClockOut = () =>
    withBusy(async () => {
      await rpcClockOut();
      await invalidate();
      toast.success('בוצעה יציאה מהעבודה - יום עבודה נעים!');
    });

  const handleStartBreak = () =>
    withBusy(async () => {
      await rpcStartBreak();
      await invalidate();
      toast.success('יצאת להפסקה');
    });

  const handleEndBreak = () =>
    withBusy(async () => {
      await rpcEndBreak();
      await invalidate();
      toast.success('חזרת מהפסקה');
    });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="size-8 text-brand-600" />
      </div>
    );
  }

  const isWorking = Boolean(attendance);
  const isOnBreak = Boolean(openBreak);

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">שלום, {profile?.full_name?.split(' ')[0]} 👋</h1>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col items-center gap-6 px-6 py-8">
          <LiveClock />

          <div className="flex flex-col items-center gap-1">
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${
                isOnBreak
                  ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/10'
                  : isWorking
                    ? 'bg-success-50 text-success-600 dark:bg-success-500/10'
                    : 'bg-ink-100 text-ink-500 dark:bg-ink-800'
              }`}
            >
              <span
                className={`size-2 rounded-full ${
                  isOnBreak ? 'bg-warning-500' : isWorking ? 'animate-pulse-ring bg-success-500' : 'bg-ink-400'
                }`}
              />
              {isOnBreak ? 'בהפסקה' : isWorking ? 'בעבודה' : 'לא בעבודה'}
            </span>
          </div>

          {!isWorking ? (
            <Button size="xl" variant="success" fullWidth loading={busy} onClick={handleClockIn} className="max-w-xs">
              <LogIn className="size-6" />
              כניסה לעבודה
            </Button>
          ) : (
            <div className="flex w-full max-w-xs flex-col items-center gap-4">
              <div className="text-center">
                <p className="font-mono text-3xl font-extrabold text-ink-900 dark:text-ink-50">
                  {formatDurationShort(isOnBreak ? breakElapsed : workElapsed)}
                </p>
                <p className="text-sm text-ink-500 dark:text-ink-400">
                  {isOnBreak ? 'זמן הפסקה' : 'זמן עבודה מהכניסה האחרונה'}
                </p>
              </div>

              {isOnBreak ? (
                <Button size="xl" variant="primary" fullWidth loading={busy} onClick={handleEndBreak}>
                  <PlayCircle className="size-6" />
                  חזרה מהפסקה
                </Button>
              ) : (
                <>
                  <Button size="xl" variant="danger" fullWidth loading={busy} onClick={handleClockOut}>
                    <LogOut className="size-6" />
                    יציאה מהעבודה
                  </Button>
                  <Button size="md" variant="secondary" fullWidth loading={busy} onClick={handleStartBreak}>
                    <Coffee className="size-4" />
                    יציאה להפסקה
                  </Button>
                </>
              )}

              <p className="text-xs text-ink-400">התחלת לעבוד היום בשעה {formatTimeHe(attendance!.clock_in)}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-ink-500 dark:text-ink-400">סה״כ עבודה היום</p>
            <p className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">{formatDurationLong(todayTotalMinutes)}</p>
          </div>
          {previousBreaksMinutes > 0 && (
            <div className="text-left">
              <p className="text-xs text-ink-400">הפסקות</p>
              <p className="text-sm font-semibold text-warning-600">{formatDurationShort(previousBreaksMinutes)}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
