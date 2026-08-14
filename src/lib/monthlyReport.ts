import type { Profile, PayrollRules } from '../types/database';
import { fetchEmployeeMonthData, buildMonthlyRows, type DailyRow } from './reportData';

export interface EmployeeMonthReport {
  employee: Profile;
  rows: DailyRow[];
  totals: ReturnType<typeof buildMonthlyRows>['totals'];
  missingDays: number;
  vacationDays: number;
  sickDays: number;
  otherAbsenceDays: number;
  estimatedWage: number | null;
}

export async function buildCompanyMonthReport(
  employees: Profile[],
  year: number,
  month: number,
  rules: PayrollRules,
): Promise<EmployeeMonthReport[]> {
  const results = await Promise.all(
    employees.map(async (employee) => {
      const data = await fetchEmployeeMonthData(employee.id, year, month);
      const built = buildMonthlyRows(year, month, data, rules);
      const otherAbsenceDays = built.rows.filter((r) => r.status === 'military' || r.status === 'holiday' || r.status === 'other_absence').length;

      const estimatedWage =
        employee.hourly_wage != null
          ? Math.round(
              ((built.totals.regularMinutes / 60) * employee.hourly_wage +
                (built.totals.overtimeTier1Minutes / 60) * employee.hourly_wage * rules.overtimeTier1Rate +
                (built.totals.overtimeTier2Minutes / 60) * employee.hourly_wage * rules.overtimeTier2Rate) *
                100,
            ) / 100
          : null;

      return {
        employee,
        rows: built.rows,
        totals: built.totals,
        missingDays: built.missingDays,
        vacationDays: built.vacationDays,
        sickDays: built.sickDays,
        otherAbsenceDays,
        estimatedWage,
      } satisfies EmployeeMonthReport;
    }),
  );

  return results;
}
