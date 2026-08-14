import { supabase } from './supabase';
import { monthRange, todayDateStr } from './time';
import { computeDay, summarizeDays, type DayComputation } from './payroll';
import type { Absence, Attendance, BreakRow, PayrollRules } from '../types/database';

export interface AttendanceWithBreaks extends Attendance {
  breaks: BreakRow[];
}

export interface EmployeeMonthData {
  attendance: AttendanceWithBreaks[];
  absences: Absence[];
}

export async function fetchEmployeeMonthData(employeeId: string, year: number, month: number): Promise<EmployeeMonthData> {
  const { start, end } = monthRange(year, month);

  const [{ data: attendanceRows, error: attErr }, { data: absenceRows, error: absErr }] = await Promise.all([
    supabase.from('attendance').select('*').eq('employee_id', employeeId).gte('work_date', start).lte('work_date', end).order('work_date'),
    supabase
      .from('absences')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .lte('start_date', end)
      .gte('end_date', start),
  ]);
  if (attErr) throw attErr;
  if (absErr) throw absErr;

  const attendance = (attendanceRows ?? []) as Attendance[];
  let breaks: BreakRow[] = [];
  if (attendance.length > 0) {
    const { data: breakRows } = await supabase
      .from('breaks')
      .select('*')
      .in('attendance_id', attendance.map((a) => a.id));
    breaks = (breakRows as BreakRow[] | null) ?? [];
  }

  return {
    attendance: attendance.map((a) => ({ ...a, breaks: breaks.filter((b) => b.attendance_id === a.id) })),
    absences: (absenceRows as Absence[]) ?? [],
  };
}

export type DayStatus = 'worked' | 'vacation' | 'sick' | 'military' | 'holiday' | 'other_absence' | 'missing' | 'weekend' | 'future' | 'empty';

export interface DailyRow {
  date: string;
  dayName: string;
  sessions: AttendanceWithBreaks[];
  clockIn: string | null;
  clockOut: string | null;
  breakMinutes: number;
  computation: DayComputation;
  status: DayStatus;
  absence: Absence | null;
}

const ABSENCE_STATUS: Record<Absence['type'], DayStatus> = {
  vacation: 'vacation',
  sick: 'sick',
  military: 'military',
  holiday: 'holiday',
  other: 'other_absence',
};

export function buildMonthlyRows(
  year: number,
  month: number,
  data: EmployeeMonthData,
  rules: PayrollRules,
): { rows: DailyRow[]; totals: ReturnType<typeof summarizeDays>; missingDays: number; vacationDays: number; sickDays: number } {
  const { daysInMonth } = monthRange(year, month);
  const today = todayDateStr();
  const rows: DailyRow[] = [];
  const computations: DayComputation[] = [];
  let missingDays = 0;
  let vacationDays = 0;
  let sickDays = 0;

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    const isFuture = date > today;
    const sessions = data.attendance.filter((a) => a.work_date === date);
    const absence = data.absences.find((a) => a.start_date <= date && a.end_date >= date) ?? null;

    const primary = sessions[0] ?? null;
    const dayComputation = sessions.reduce<DayComputation>(
      (acc, s) => {
        const c = computeDay(s, s.breaks, rules);
        return {
          workDate: date,
          grossMinutes: acc.grossMinutes + c.grossMinutes,
          unpaidBreakMinutes: acc.unpaidBreakMinutes + c.unpaidBreakMinutes,
          workedMinutes: acc.workedMinutes + c.workedMinutes,
          regularMinutes: acc.regularMinutes + c.regularMinutes,
          overtimeTier1Minutes: acc.overtimeTier1Minutes + c.overtimeTier1Minutes,
          overtimeTier2Minutes: acc.overtimeTier2Minutes + c.overtimeTier2Minutes,
        };
      },
      { workDate: date, grossMinutes: 0, unpaidBreakMinutes: 0, workedMinutes: 0, regularMinutes: 0, overtimeTier1Minutes: 0, overtimeTier2Minutes: 0 },
    );

    let status: DayStatus;
    if (sessions.length > 0) {
      status = 'worked';
      computations.push(dayComputation);
    } else if (absence) {
      status = ABSENCE_STATUS[absence.type];
      if (absence.type === 'vacation') vacationDays++;
      if (absence.type === 'sick') sickDays++;
    } else if (isFuture) {
      status = 'future';
    } else if (dayOfWeek === 5 || dayOfWeek === 6) {
      status = 'weekend';
    } else {
      status = 'missing';
      missingDays++;
    }

    rows.push({
      date,
      dayName: HEBREW_DAYS[dayOfWeek],
      sessions,
      clockIn: primary?.clock_in ?? null,
      clockOut: sessions.length > 0 ? (sessions[sessions.length - 1].clock_out ?? null) : null,
      breakMinutes: sessions.reduce((sum, s) => sum + (rules.breaksArePaid ? 0 : sumBreaks(s.breaks)), 0),
      computation: dayComputation,
      status,
      absence,
    });
  }

  return { rows, totals: summarizeDays(computations), missingDays, vacationDays, sickDays };
}

function sumBreaks(breaks: BreakRow[]): number {
  return breaks.reduce((sum, b) => {
    if (!b.break_end) return sum;
    return sum + (new Date(b.break_end).getTime() - new Date(b.break_start).getTime()) / 60000;
  }, 0);
}

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export const STATUS_LABEL: Record<DayStatus, string> = {
  worked: 'עבד',
  vacation: 'חופשה',
  sick: 'מחלה',
  military: 'מילואים',
  holiday: 'חג',
  other_absence: 'היעדרות',
  missing: 'דיווח חסר',
  weekend: 'סוף שבוע',
  future: '—',
  empty: '—',
};
