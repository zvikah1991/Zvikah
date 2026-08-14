import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { todayDateStr } from '../lib/time';

export interface AppNotification {
  id: string;
  kind: 'open_session' | 'missing_report' | 'pending_correction' | 'pending_absence' | 'month_open';
  message: string;
  href: string;
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<AppNotification[]> => {
      const notifications: AppNotification[] = [];
      const now = new Date();

      const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
      const { data: longOpen } = await supabase
        .from('attendance')
        .select('id, employee_id, clock_in, profile:profiles!attendance_employee_id_fkey(full_name)')
        .is('clock_out', null)
        .lt('clock_in', twelveHoursAgo);

      (longOpen ?? []).forEach((row: any) => {
        notifications.push({
          id: `open-${row.id}`,
          kind: 'open_session',
          message: `${row.profile?.full_name ?? 'עובד'} נכנס לעבודה ולא ביצע יציאה`,
          href: '/admin/attendance',
        });
      });

      const { count: pendingCorrections } = await supabase
        .from('attendance_corrections')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (pendingCorrections) {
        notifications.push({
          id: 'pending-corrections',
          kind: 'pending_correction',
          message: `${pendingCorrections} בקשות תיקון שעות ממתינות לאישור`,
          href: '/admin/requests',
        });
      }

      const { count: pendingAbsences } = await supabase
        .from('absences')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (pendingAbsences) {
        notifications.push({
          id: 'pending-absences',
          kind: 'pending_absence',
          message: `${pendingAbsences} בקשות חופשה/מחלה ממתינות לאישור`,
          href: '/admin/absences',
        });
      }

      const { count: missingToday } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'employee')
        .eq('active', true);
      const { data: reportedToday } = await supabase.from('attendance').select('employee_id').eq('work_date', todayDateStr());
      const reportedSet = new Set((reportedToday ?? []).map((r) => r.employee_id));
      const isWeekday = now.getDay() !== 5 && now.getDay() !== 6;
      if (isWeekday && missingToday && missingToday - reportedSet.size > 0) {
        notifications.push({
          id: 'missing-today',
          kind: 'missing_report',
          message: `${missingToday - reportedSet.size} עובדים ללא דיווח נוכחות היום`,
          href: '/admin/attendance',
        });
      }

      const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const { data: prevLock } = await supabase
        .from('monthly_locks')
        .select('locked')
        .eq('year', prevMonthDate.getFullYear())
        .eq('month', prevMonthDate.getMonth() + 1)
        .maybeSingle();
      if (!prevLock?.locked) {
        notifications.push({
          id: 'prev-month-open',
          kind: 'month_open',
          message: 'החודש הקודם עדיין לא נסגר',
          href: '/admin/reports',
        });
      }

      return notifications;
    },
    refetchInterval: 60_000,
  });
}
