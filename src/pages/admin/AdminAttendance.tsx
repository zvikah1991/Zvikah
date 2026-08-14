import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Pencil, Plus, Lock, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useEmployees } from '../../hooks/useAdminData';
import { monthRange, hebrewMonthName, formatDateHe, formatTimeHe, diffMinutes, formatDurationShort } from '../../lib/time';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select, Input, Textarea, FormGroup } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import type { Attendance, Profile } from '../../types/database';

interface EditState {
  id: string | null;
  employee_id: string;
  work_date: string;
  clock_in_time: string;
  clock_out_time: string;
  notes: string;
}

function toLocalDateTime(date: string, time: string): string | null {
  if (!time) return null;
  return new Date(`${date}T${time}:00`).toISOString();
}

function toTimeInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AdminAttendance() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [employeeFilter, setEmployeeFilter] = useState('all');
  const [editState, setEditState] = useState<EditState | null>(null);
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: employees } = useEmployees();

  const { start, end } = monthRange(year, month);

  const { data: rows, isLoading } = useQuery({
    queryKey: ['admin-attendance', year, month],
    queryFn: async (): Promise<(Attendance & { profile: Profile })[]> => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*, profile:profiles!attendance_employee_id_fkey(*)')
        .gte('work_date', start)
        .lte('work_date', end)
        .order('work_date', { ascending: false })
        .order('clock_in', { ascending: false });
      if (error) throw error;
      return data as unknown as (Attendance & { profile: Profile })[];
    },
  });

  const { data: lock } = useQuery({
    queryKey: ['month-lock', year, month],
    queryFn: async () => {
      const { data } = await supabase.from('monthly_locks').select('*').eq('year', year).eq('month', month).maybeSingle();
      return data;
    },
  });

  const filtered = useMemo(
    () => (employeeFilter === 'all' ? rows : rows?.filter((r) => r.employee_id === employeeFilter)),
    [rows, employeeFilter],
  );

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setMonth(m);
    setYear(y);
  }

  const saveMutation = useMutation({
    mutationFn: async (state: EditState) => {
      const { error } = await supabase.rpc('admin_upsert_attendance', {
        p_id: state.id,
        p_employee_id: state.employee_id,
        p_work_date: state.work_date,
        p_clock_in: toLocalDateTime(state.work_date, state.clock_in_time),
        p_clock_out: toLocalDateTime(state.work_date, state.clock_out_time),
        p_notes: state.notes || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('הנוכחות עודכנה בהצלחה');
      setEditState(null);
      queryClient.invalidateQueries({ queryKey: ['admin-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['live-employees'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">נוכחות</h1>
        <Button
          onClick={() =>
            setEditState({ id: null, employee_id: employees?.[0]?.id ?? '', work_date: new Date().toISOString().slice(0, 10), clock_in_time: '', clock_out_time: '', notes: '' })
          }
        >
          <Plus className="size-4" />
          הוספת רשומה
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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

        <Select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="w-56">
          <option value="all">כל העובדים</option>
          {employees?.map((e) => (
            <option key={e.id} value={e.id}>
              {e.full_name}
            </option>
          ))}
        </Select>

        {lock?.locked && (
          <Badge tone="gray">
            <Lock className="size-3" /> החודש נעול
          </Badge>
        )}
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-brand-600" />
          </div>
        ) : !filtered?.length ? (
          <EmptyState icon={Clock} title="אין רשומות נוכחות בטווח זה" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/70 text-xs font-semibold text-ink-500 dark:border-ink-800 dark:bg-ink-800/40 dark:text-ink-400">
                  <th className="px-4 py-3 text-right">עובד</th>
                  <th className="px-4 py-3 text-right">תאריך</th>
                  <th className="px-4 py-3 text-right">כניסה</th>
                  <th className="px-4 py-3 text-right">יציאה</th>
                  <th className="px-4 py-3 text-right">שעות</th>
                  <th className="px-4 py-3 text-right">מקור</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-ink-800 dark:text-ink-100">{row.profile.full_name}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink-600 dark:text-ink-300">{formatDateHe(row.work_date)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-ink-600 dark:text-ink-300">{formatTimeHe(row.clock_in)}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-ink-600 dark:text-ink-300">
                      {row.clock_out ? formatTimeHe(row.clock_out) : <span className="text-danger-500">פתוח</span>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono font-semibold text-ink-800 dark:text-ink-100">
                      {row.clock_out ? formatDurationShort(diffMinutes(row.clock_in, row.clock_out)) : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <Badge tone={row.source === 'self' ? 'gray' : row.source === 'correction' ? 'brand' : 'warning'}>
                        {row.source === 'self' ? 'עצמי' : row.source === 'correction' ? 'תיקון' : 'מנהל'}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-left">
                      <button
                        onClick={() =>
                          setEditState({
                            id: row.id,
                            employee_id: row.employee_id,
                            work_date: row.work_date,
                            clock_in_time: toTimeInput(row.clock_in),
                            clock_out_time: toTimeInput(row.clock_out),
                            notes: row.notes ?? '',
                          })
                        }
                        className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"
                      >
                        <Pencil className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {editState && (
        <Modal open onClose={() => setEditState(null)} title={editState.id ? 'עריכת רשומת נוכחות' : 'רשומת נוכחות חדשה'}>
          <div className="flex flex-col gap-4">
            <FormGroup label="עובד" required>
              <Select
                value={editState.employee_id}
                disabled={Boolean(editState.id)}
                onChange={(e) => setEditState({ ...editState, employee_id: e.target.value })}
              >
                {employees?.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <FormGroup label="תאריך" required>
              <Input type="date" value={editState.work_date} onChange={(e) => setEditState({ ...editState, work_date: e.target.value })} />
            </FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="שעת כניסה">
                <Input type="time" value={editState.clock_in_time} onChange={(e) => setEditState({ ...editState, clock_in_time: e.target.value })} />
              </FormGroup>
              <FormGroup label="שעת יציאה">
                <Input type="time" value={editState.clock_out_time} onChange={(e) => setEditState({ ...editState, clock_out_time: e.target.value })} />
              </FormGroup>
            </div>
            <FormGroup label="הערות">
              <Textarea value={editState.notes} onChange={(e) => setEditState({ ...editState, notes: e.target.value })} />
            </FormGroup>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditState(null)}>
                ביטול
              </Button>
              <Button loading={saveMutation.isPending} onClick={() => saveMutation.mutate(editState)}>
                שמירה
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
