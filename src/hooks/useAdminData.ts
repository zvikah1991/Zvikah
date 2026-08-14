import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { todayDateStr } from '../lib/time';
import type { Absence, AttendanceCorrection, Profile } from '../types/database';

export function usePendingCounts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['pending-counts'],
    queryFn: async () => {
      const [corrections, absences] = await Promise.all([
        supabase.from('attendance_corrections').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('absences').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return { corrections: corrections.count ?? 0, absences: absences.count ?? 0 };
    },
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('pending-counts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_corrections' }, () =>
        queryClient.invalidateQueries({ queryKey: ['pending-counts'] }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'absences' }, () =>
        queryClient.invalidateQueries({ queryKey: ['pending-counts'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useEmployees(includeInactive = true) {
  return useQuery({
    queryKey: ['employees', includeInactive],
    queryFn: async (): Promise<Profile[]> => {
      let q = supabase.from('profiles').select('*').eq('role', 'employee').order('full_name');
      if (!includeInactive) q = q.eq('active', true);
      const { data, error } = await q;
      if (error) throw error;
      return data as Profile[];
    },
  });
}

export interface LiveEmployeeRow {
  profile: Profile;
  status: 'working' | 'break' | 'off' | 'missing';
  clockIn: string | null;
  elapsedMinutes: number;
}

export function useLiveEmployees() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['live-employees'],
    queryFn: async (): Promise<LiveEmployeeRow[]> => {
      const { data: employees, error } = await supabase.from('profiles').select('*').eq('role', 'employee').eq('active', true).order('full_name');
      if (error) throw error;

      const { data: openAttendance } = await supabase.from('attendance').select('*').is('clock_out', null);
      const { data: openBreaks } = await supabase.from('breaks').select('*').is('break_end', null);

      const { data: todayRows } = await supabase.from('attendance').select('employee_id').eq('work_date', todayDateStr());
      const reportedToday = new Set((todayRows ?? []).map((r) => r.employee_id));

      return (employees as Profile[]).map((profile) => {
        const att = openAttendance?.find((a) => a.employee_id === profile.id);
        if (!att) {
          const missing = !reportedToday.has(profile.id) && isWeekday();
          return { profile, status: missing ? 'missing' : 'off', clockIn: null, elapsedMinutes: 0 } as LiveEmployeeRow;
        }
        const onBreak = openBreaks?.some((b) => b.attendance_id === att.id);
        return {
          profile,
          status: onBreak ? 'break' : 'working',
          clockIn: att.clock_in,
          elapsedMinutes: (Date.now() - new Date(att.clock_in).getTime()) / 60000,
        };
      });
    },
    refetchInterval: 20_000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('live-employees')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance' }, () =>
        queryClient.invalidateQueries({ queryKey: ['live-employees'] }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'breaks' }, () =>
        queryClient.invalidateQueries({ queryKey: ['live-employees'] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

function isWeekday(): boolean {
  const day = new Date().getDay();
  return day !== 5 && day !== 6;
}

export function usePendingCorrections() {
  return useQuery({
    queryKey: ['pending-corrections'],
    queryFn: async (): Promise<(AttendanceCorrection & { profile: Profile })[]> => {
      const { data, error } = await supabase
        .from('attendance_corrections')
        .select('*, profile:profiles!attendance_corrections_employee_id_fkey(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as (AttendanceCorrection & { profile: Profile })[];
    },
  });
}

export function usePendingAbsences() {
  return useQuery({
    queryKey: ['pending-absences'],
    queryFn: async (): Promise<(Absence & { profile: Profile })[]> => {
      const { data, error } = await supabase
        .from('absences')
        .select('*, profile:profiles!absences_employee_id_fkey(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as (Absence & { profile: Profile })[];
    },
  });
}
