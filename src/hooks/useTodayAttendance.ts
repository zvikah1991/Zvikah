import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { todayDateStr } from '../lib/time';
import type { Attendance, BreakRow } from '../types/database';

export interface AttendanceWithBreaks extends Attendance {
  breaks: BreakRow[];
}

export function useTodayAttendance(employeeId: string | undefined) {
  return useQuery({
    queryKey: ['today-attendance', employeeId],
    queryFn: async (): Promise<AttendanceWithBreaks[]> => {
      const { data: rows, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId!)
        .eq('work_date', todayDateStr())
        .order('clock_in', { ascending: true });
      if (error) throw error;

      const attendance = (rows ?? []) as Attendance[];
      if (attendance.length === 0) return [];

      const { data: breakRows } = await supabase
        .from('breaks')
        .select('*')
        .in('attendance_id', attendance.map((a) => a.id));

      return attendance.map((a) => ({
        ...a,
        breaks: (breakRows as BreakRow[] | null)?.filter((b) => b.attendance_id === a.id) ?? [],
      }));
    },
    enabled: Boolean(employeeId),
    refetchInterval: 30_000,
  });
}
