import type { Attendance, BreakRow, PayrollRules } from '../types/database';
import { diffMinutes } from './time';

export interface DayComputation {
  workDate: string;
  grossMinutes: number;
  unpaidBreakMinutes: number;
  workedMinutes: number;
  regularMinutes: number;
  overtimeTier1Minutes: number;
  overtimeTier2Minutes: number;
}

export function computeBreakMinutes(breaks: BreakRow[]): number {
  return breaks.reduce((sum, b) => sum + diffMinutes(b.break_start, b.break_end), 0);
}

export function computeDay(
  attendance: Pick<Attendance, 'work_date' | 'clock_in' | 'clock_out'>,
  breaks: BreakRow[],
  rules: PayrollRules,
): DayComputation {
  const grossMinutes = attendance.clock_out ? diffMinutes(attendance.clock_in, attendance.clock_out) : 0;
  const breakMinutes = computeBreakMinutes(breaks);
  const unpaidBreakMinutes = rules.breaksArePaid ? 0 : breakMinutes;
  const workedMinutes = Math.max(0, grossMinutes - unpaidBreakMinutes);

  const standardMinutes = rules.standardDailyHours * 60;
  const tier1Cap = rules.overtimeTier1Hours * 60;

  const regularMinutes = Math.min(workedMinutes, standardMinutes);
  const overMinutes = Math.max(0, workedMinutes - standardMinutes);
  const overtimeTier1Minutes = Math.min(overMinutes, tier1Cap);
  const overtimeTier2Minutes = Math.max(0, overMinutes - tier1Cap);

  return {
    workDate: attendance.work_date,
    grossMinutes,
    unpaidBreakMinutes,
    workedMinutes,
    regularMinutes,
    overtimeTier1Minutes,
    overtimeTier2Minutes,
  };
}

export interface MonthTotals {
  workDays: number;
  regularMinutes: number;
  overtimeTier1Minutes: number;
  overtimeTier2Minutes: number;
  totalMinutes: number;
  breakMinutes: number;
}

export function summarizeDays(days: DayComputation[]): MonthTotals {
  return days.reduce<MonthTotals>(
    (acc, d) => ({
      workDays: acc.workDays + (d.workedMinutes > 0 ? 1 : 0),
      regularMinutes: acc.regularMinutes + d.regularMinutes,
      overtimeTier1Minutes: acc.overtimeTier1Minutes + d.overtimeTier1Minutes,
      overtimeTier2Minutes: acc.overtimeTier2Minutes + d.overtimeTier2Minutes,
      totalMinutes: acc.totalMinutes + d.workedMinutes,
      breakMinutes: acc.breakMinutes + d.unpaidBreakMinutes,
    }),
    { workDays: 0, regularMinutes: 0, overtimeTier1Minutes: 0, overtimeTier2Minutes: 0, totalMinutes: 0, breakMinutes: 0 },
  );
}

/** אומדן שכר לפי שעות מאושרות - אינו מחליף חישוב רשמי של רו"ח / מערכת שכר */
export function estimateWage(totals: MonthTotals, hourlyWage: number, rules: PayrollRules): number {
  const regular = (totals.regularMinutes / 60) * hourlyWage;
  const tier1 = (totals.overtimeTier1Minutes / 60) * hourlyWage * rules.overtimeTier1Rate;
  const tier2 = (totals.overtimeTier2Minutes / 60) * hourlyWage * rules.overtimeTier2Rate;
  return Math.round((regular + tier1 + tier2) * 100) / 100;
}

export const DEFAULT_PAYROLL_RULES: PayrollRules = {
  standardDailyHours: 8,
  standardWeeklyHours: 42,
  overtimeTier1Rate: 1.25,
  overtimeTier1Hours: 2,
  overtimeTier2Rate: 1.5,
  breaksArePaid: false,
  minBreakMinutesUnpaid: 30,
};
