import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, CalendarDays, Paperclip } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { usePendingAbsences } from '../../hooks/useAdminData';
import { formatDateHe, formatDateTimeHe } from '../../lib/time';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { Absence, AbsenceType, Profile } from '../../types/database';

const TYPE_LABEL: Record<AbsenceType, string> = {
  vacation: 'חופשה',
  sick: 'מחלה',
  military: 'מילואים',
  holiday: 'חג',
  other: 'היעדרות אחרת',
};

const STATUS_LABEL = { pending: 'ממתין לאישור', approved: 'אושר', rejected: 'נדחה' } as const;
const STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminAbsences() {
  const { data: absences, isLoading } = usePendingAbsences();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [reviewTarget, setReviewTarget] = useState<{ absence: Absence & { profile: Profile }; approve: boolean } | null>(null);
  const [note, setNote] = useState('');

  const filtered = useMemo(() => (filter === 'all' ? absences : absences?.filter((a) => a.status === filter)), [absences, filter]);

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('review_leave', {
        p_id: reviewTarget!.absence.id,
        p_approve: reviewTarget!.approve,
        p_note: note || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(reviewTarget?.approve ? 'הבקשה אושרה' : 'הבקשה נדחתה');
      setReviewTarget(null);
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['pending-absences'] });
      queryClient.invalidateQueries({ queryKey: ['pending-counts'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function openAttachment(path: string) {
    const { data, error } = await supabase.storage.from('leave-attachments').createSignedUrl(path, 60);
    if (error || !data) {
      toast.error('לא ניתן לפתוח את הקובץ');
      return;
    }
    window.open(data.signedUrl, '_blank');
  }

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">חופשות ומחלות</h1>

      <div className="flex gap-2">
        {(['pending', 'approved', 'rejected', 'all'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
              filter === f
                ? 'bg-ink-900 text-white dark:bg-ink-50 dark:text-ink-900'
                : 'bg-white text-ink-600 hover:bg-ink-100 dark:bg-ink-900 dark:text-ink-300 dark:hover:bg-ink-800'
            }`}
          >
            {{ pending: 'ממתינות', approved: 'אושרו', rejected: 'נדחו', all: 'הכל' }[f]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner className="text-brand-600" />
        </div>
      ) : !filtered?.length ? (
        <Card>
          <EmptyState icon={CalendarDays} title="אין בקשות" description="בקשות חופשה ומחלה יופיעו כאן" />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((absence) => (
            <Card key={absence.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink-900 dark:text-ink-50">{absence.profile.full_name}</p>
                    <Badge tone="brand">{TYPE_LABEL[absence.type]}</Badge>
                    <Badge tone={STATUS_TONE[absence.status]}>{STATUS_LABEL[absence.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                    {formatDateHe(absence.start_date)} — {formatDateHe(absence.end_date)}
                  </p>
                  {absence.reason && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{absence.reason}</p>}
                  {absence.attachment_path && (
                    <button
                      onClick={() => openAttachment(absence.attachment_path!)}
                      className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:underline dark:text-brand-400"
                    >
                      <Paperclip className="size-3.5" />
                      צפייה במסמך מצורף
                    </button>
                  )}
                  <p className="mt-1 text-xs text-ink-400">הוגש ב-{formatDateTimeHe(absence.created_at)}</p>
                </div>
                {absence.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => setReviewTarget({ absence, approve: true })}>
                      <Check className="size-4" />
                      אישור
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setReviewTarget({ absence, approve: false })}>
                      <X className="size-4" />
                      דחייה
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {reviewTarget && (
        <Modal open onClose={() => setReviewTarget(null)} title={reviewTarget.approve ? 'אישור בקשה' : 'דחיית בקשה'}>
          <div className="flex flex-col gap-4">
            <Textarea placeholder="הערה (לא חובה)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReviewTarget(null)}>
                ביטול
              </Button>
              <Button
                variant={reviewTarget.approve ? 'success' : 'danger'}
                loading={reviewMutation.isPending}
                onClick={() => reviewMutation.mutate()}
              >
                {reviewTarget.approve ? 'אישור סופי' : 'דחייה סופית'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
