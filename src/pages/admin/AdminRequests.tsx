import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, Inbox } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { usePendingCorrections } from '../../hooks/useAdminData';
import { formatDateHe, formatDateTimeHe } from '../../lib/time';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { AttendanceCorrection, Profile } from '../../types/database';

const STATUS_LABEL = { pending: 'ממתין לאישור', approved: 'אושר', rejected: 'נדחה' } as const;
const STATUS_TONE = { pending: 'warning', approved: 'success', rejected: 'danger' } as const;

type Filter = 'pending' | 'approved' | 'rejected' | 'all';

export default function AdminRequests() {
  const { data: requests, isLoading } = usePendingCorrections();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('pending');
  const [reviewTarget, setReviewTarget] = useState<{ req: AttendanceCorrection & { profile: Profile }; approve: boolean } | null>(null);
  const [note, setNote] = useState('');

  const filtered = useMemo(() => (filter === 'all' ? requests : requests?.filter((r) => r.status === filter)), [requests, filter]);

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('review_correction', {
        p_id: reviewTarget!.req.id,
        p_approve: reviewTarget!.approve,
        p_note: note || null,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success(reviewTarget?.approve ? 'הבקשה אושרה והשעות עודכנו' : 'הבקשה נדחתה');
      setReviewTarget(null);
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['pending-corrections'] });
      queryClient.invalidateQueries({ queryKey: ['pending-counts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-attendance'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">בקשות תיקון שעות</h1>

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
          <EmptyState icon={Inbox} title="אין בקשות" description="בקשות תיקון שעות יופיעו כאן" />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((req) => (
            <Card key={req.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-ink-900 dark:text-ink-50">{req.profile.full_name}</p>
                    <Badge tone={STATUS_TONE[req.status]}>{STATUS_LABEL[req.status]}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-ink-600 dark:text-ink-300">
                    תאריך: {formatDateHe(req.work_date)}
                    {req.requested_clock_in && ` · כניסה מבוקשת: ${req.requested_clock_in.slice(0, 5)}`}
                    {req.requested_clock_out && ` · יציאה מבוקשת: ${req.requested_clock_out.slice(0, 5)}`}
                  </p>
                  <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">סיבה: {req.reason}</p>
                  <p className="mt-1 text-xs text-ink-400">הוגש ב-{formatDateTimeHe(req.created_at)}</p>
                </div>
                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="success" onClick={() => setReviewTarget({ req, approve: true })}>
                      <Check className="size-4" />
                      אישור
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setReviewTarget({ req, approve: false })}>
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
        <Modal open onClose={() => setReviewTarget(null)} title={reviewTarget.approve ? 'אישור בקשת תיקון' : 'דחיית בקשת תיקון'}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-600 dark:text-ink-300">
              {reviewTarget.approve
                ? 'לאחר האישור, שעות הנוכחות יעודכנו אוטומטית בהתאם לבקשה.'
                : 'הבקשה תסומן כנדחתה ולא תשפיע על שעות הנוכחות.'}
            </p>
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
