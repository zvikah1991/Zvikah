import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Attendance, BreakRow } from '../types/database';

interface OpenState {
  attendance: Attendance | null;
  openBreak: BreakRow | null;
}

async function fetchOpenState(employeeId: string): Promise<OpenState> {
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!attendance) return { attendance: null, openBreak: null };

  const { data: openBreak } = await supabase
    .from('breaks')
    .select('*')
    .eq('attendance_id', attendance.id)
    .is('break_end', null)
    .maybeSingle();

  return { attendance: attendance as Attendance, openBreak: (openBreak as BreakRow) ?? null };
}

export function useMyOpenAttendance() {
  const { session } = useAuth();
  const employeeId = session?.user.id;
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['my-open-attendance', employeeId],
    queryFn: () => fetchOpenState(employeeId!),
    enabled: Boolean(employeeId),
    refetchInterval: 30_000,
  });

  useEffect(() => {
    if (!employeeId) return;
    const channel = supabase
      .channel(`attendance-${employeeId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attendance', filter: `employee_id=eq.${employeeId}` },
        () => queryClient.invalidateQueries({ queryKey: ['my-open-attendance', employeeId] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'breaks' },
        () => queryClient.invalidateQueries({ queryKey: ['my-open-attendance', employeeId] }),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId, queryClient]);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ['my-open-attendance', employeeId] }),
    [queryClient, employeeId],
  );

  return { ...query, invalidate };
}

/** טיימר חי לשעות עבודה היום, מתעדכן כל שנייה */
export function useLiveElapsedMinutes(sinceIso: string | null | undefined): number {
  const [minutes, setMinutes] = useState(() => (sinceIso ? (Date.now() - new Date(sinceIso).getTime()) / 60000 : 0));

  useEffect(() => {
    if (!sinceIso) {
      setMinutes(0);
      return;
    }
    const tick = () => setMinutes((Date.now() - new Date(sinceIso).getTime()) / 60000);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sinceIso]);

  return minutes;
}

export async function rpcClockIn(notes?: string) {
  const { data, error } = await supabase.rpc('clock_in', { p_notes: notes ?? null });
  if (error) throw new Error(translateRpcError(error.message));
  return data as unknown as Attendance;
}

export async function rpcClockOut() {
  const { data, error } = await supabase.rpc('clock_out');
  if (error) throw new Error(translateRpcError(error.message));
  return data as unknown as Attendance;
}

export async function rpcStartBreak() {
  const { data, error } = await supabase.rpc('start_break');
  if (error) throw new Error(translateRpcError(error.message));
  return data as unknown as BreakRow;
}

export async function rpcEndBreak() {
  const { data, error } = await supabase.rpc('end_break');
  if (error) throw new Error(translateRpcError(error.message));
  return data as unknown as BreakRow;
}

function translateRpcError(message: string): string {
  const known: Record<string, string> = {
    'קיימת כניסה פתוחה - יש לבצע יציאה קודם': 'קיימת כניסה פתוחה - יש לבצע יציאה קודם',
    'לא נמצאה כניסה פתוחה': 'לא נמצאה כניסה פתוחה',
    'יש לסיים הפסקה פתוחה לפני היציאה': 'יש לסיים הפסקה פתוחה לפני היציאה',
    'אין כניסה פתוחה כרגע': 'אין כניסה פתוחה כרגע - יש להיכנס לעבודה קודם',
    'כבר קיימת הפסקה פתוחה': 'כבר קיימת הפסקה פתוחה',
    'אין הפסקה פתוחה כרגע': 'אין הפסקה פתוחה כרגע',
    'החודש נעול לעריכה': 'החודש נעול לעריכה על ידי המנהל',
    'המשתמש אינו פעיל': 'המשתמש אינו פעיל, פנה למנהל',
  };
  for (const key of Object.keys(known)) {
    if (message.includes(key)) return known[key];
  }
  return message || 'האירעה שגיאה, נסה שוב';
}
