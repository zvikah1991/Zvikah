import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Paperclip } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { formatDateHe } from '../../lib/time';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select, FormGroup } from '../../components/ui/Field';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import type { Absence, AbsenceType } from '../../types/database';

const TYPE_LABEL: Record<AbsenceType, string> = {
  vacation: 'חופשה',
  sick: 'מחלה',
  military: 'מילואים',
  holiday: 'חג',
  other: 'היעדרות אחרת',
};

const STATUS_LABEL = { pending: 'ממתין לאישור', approved: 'אושר', rejected: 'נדחה' } as const;
const STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;

export default function Absences() {
  const { session } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [type, setType] = useState<AbsenceType>('vacation');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const { data: absences, isLoading } = useQuery({
    queryKey: ['my-absences', session?.user.id],
    queryFn: async (): Promise<Absence[]> => {
      const { data, error } = await supabase
        .from('absences')
        .select('*')
        .eq('employee_id', session!.user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Absence[];
    },
    enabled: Boolean(session),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      let attachmentPath: string | null = null;
      if (file) {
        const path = `${session!.user.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from('leave-attachments').upload(path, file);
        if (uploadErr) throw new Error('העלאת הקובץ נכשלה: ' + uploadErr.message);
        attachmentPath = path;
      }

      const { error } = await supabase.rpc('request_leave', {
        p_type: type,
        p_start: startDate,
        p_end: endDate,
        p_reason: reason || null,
        p_attachment_path: attachmentPath,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('הבקשה נשלחה למנהל לאישור');
      setStartDate('');
      setEndDate('');
      setReason('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['my-absences'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast.error('יש לבחור תאריכים');
      return;
    }
    if (endDate < startDate) {
      toast.error('תאריך הסיום חייב להיות אחרי תאריך ההתחלה');
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">חופשות ומחלות</h1>

      <Card>
        <CardHeader title="בקשה חדשה" />
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <FormGroup label="סוג היעדרות" required>
              <Select value={type} onChange={(e) => setType(e.target.value as AbsenceType)}>
                {Object.entries(TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="מתאריך" required>
                <Input type="date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </FormGroup>
              <FormGroup label="עד תאריך" required>
                <Input type="date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </FormGroup>
            </div>
            <FormGroup label="הערות">
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="פרטים נוספים (לא חובה)" />
            </FormGroup>
            <FormGroup label="צירוף מסמך" hint="אישור מחלה, זימון מילואים וכו' (לא חובה)">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-ink-300 px-3.5 py-2.5 text-sm text-ink-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-ink-700">
                <Paperclip className="size-4" />
                {file ? file.name : 'בחר קובץ'}
                <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
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
        ) : !absences?.length ? (
          <Card>
            <EmptyState icon={CalendarDays} title="אין בקשות" description="בקשות חופשה ומחלה שתגיש יופיעו כאן" />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {absences.map((a) => (
              <Card key={a.id} className="px-4 py-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{TYPE_LABEL[a.type]}</Badge>
                    </div>
                    <p className="mt-1.5 font-semibold text-ink-800 dark:text-ink-100">
                      {formatDateHe(a.start_date)} — {formatDateHe(a.end_date)}
                    </p>
                    {a.reason && <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">{a.reason}</p>}
                    {a.review_note && (
                      <p className="mt-1.5 rounded-lg bg-ink-50 px-2.5 py-1.5 text-xs text-ink-500 dark:bg-ink-800 dark:text-ink-400">
                        הערת מנהל: {a.review_note}
                      </p>
                    )}
                  </div>
                  <Badge tone={STATUS_TONE[a.status]}>{STATUS_LABEL[a.status]}</Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
