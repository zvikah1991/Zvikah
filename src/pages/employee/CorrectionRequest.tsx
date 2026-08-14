import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileEdit } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateHe, formatDateTimeHe } from '../../lib/time';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, FormGroup } from '../../components/ui/Field';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import type { AttendanceCorrection } from '../../types/database';

const STATUS_LABEL = { pending: 'ממתין לאישור', approved: 'אושר', rejected: 'נדחה' } as const;
const STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;

export default function CorrectionRequest() {
  const { session } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [date, setDate] = useState('');
  const [clockIn, setClockIn] = useState('');
  const [clockOut, setClockOut] = useState('');
  const [reason, setReason] = useState('');

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-corrections', session?.user.id],
    queryFn: async (): Promise<AttendanceCorrection[]> => {
      const { data, error } = await supabase
        .from('attendance_corrections')
        .select('*')
        .eq('employee_id', session!.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AttendanceCorrection[];
    },
    enabled: Boolean(session),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('request_correction', {
        p_work_date: date,
        p_clock_in: clockIn || null,
        p_clock_out: clockOut || null,
        p_reason: reason,
      });
      if (error) throw new Error(error.message.includes('נעול') ? 'החודש נעול לעריכה' : error.message);
    },
    onSuccess: () => {
      toast.success('בקשת התיקון נשלחה למנהל לאישור');
      setDate('');
      setClockIn('');
      setClockOut('');
      setReason('');
      queryClient.invalidateQueries({ queryKey: ['my-corrections'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clockIn && !clockOut) {
      toast.error('יש להזין שעת כניסה ו/או יציאה מבוקשת');
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">בקשת תיקון שעות</h1>

      <Card>
        <CardHeader title="בקשה חדשה" subtitle="הבקשה תישלח למנהל ותעודכן רק לאחר אישורו" />
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormGroup label="תאריך" required>
              <Input type="date" required value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
            </FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="שעת כניסה מבוקשת">
                <Input type="time" value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
              </FormGroup>
              <FormGroup label="שעת יציאה מבוקשת">
                <Input type="time" value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
              </FormGroup>
            </div>
            <FormGroup label="סיבה לתיקון" required>
              <Textarea required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="לדוגמה: שכחתי להחתים יציאה" />
            </FormGroup>
            <Button type="submit" loading={mutation.isPending} fullWidth>
              שליחת בקשה
            </Button>
          </form>
        </CardBody>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-bold text-ink-600 dark:text-ink-300">היסטוריית בקשות</h2>
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spinner className="text-brand-600" />
          </div>
        ) : !requests?.length ? (
          <Card>
            <EmptyState icon={FileEdit} title="אין בקשות תיקון" description="בקשות שתגיש יופיעו כאן" />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((r) => (
              <Card key={r.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-800 dark:text-ink-100">{formatDateHe(r.work_date)}</p>
                    <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
                      {r.requested_clock_in && `כניסה: ${r.requested_clock_in.slice(0, 5)}`}
                      {r.requested_clock_in && r.requested_clock_out && ' · '}
                      {r.requested_clock_out && `יציאה: ${r.requested_clock_out.slice(0, 5)}`}
                    </p>
                    <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{r.reason}</p>
                    {r.review_note && (
                      <p className="mt-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                        הערת מנהל: {r.review_note}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-ink-400">הוגש ב-{formatDateTimeHe(r.created_at)}</p>
                  </div>
                  <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
