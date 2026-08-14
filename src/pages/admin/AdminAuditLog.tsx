import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDateTimeHe } from '../../lib/time';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { AuditLog, Profile } from '../../types/database';

const ACTION_LABEL: Record<string, string> = {
  clock_in: 'כניסה לעבודה',
  clock_out: 'יציאה מהעבודה',
  start_break: 'יציאה להפסקה',
  end_break: 'חזרה מהפסקה',
  request_correction: 'בקשת תיקון שעות',
  approve_correction: 'אישור תיקון שעות',
  reject_correction: 'דחיית תיקון שעות',
  request_leave: 'בקשת חופשה/מחלה',
  approve_leave: 'אישור בקשת חופשה',
  reject_leave: 'דחיית בקשת חופשה',
  close_month: 'סגירת חודש',
  reopen_month: 'פתיחת חודש מחדש',
  update_setting: 'עדכון הגדרות',
  admin_create_attendance: 'יצירת רשומת נוכחות (מנהל)',
  admin_update_attendance: 'עריכת רשומת נוכחות (מנהל)',
};

const ENTITY_LABEL: Record<string, string> = {
  attendance: 'נוכחות',
  breaks: 'הפסקה',
  attendance_corrections: 'תיקון שעות',
  absences: 'חופשה/מחלה',
  monthly_locks: 'נעילת חודש',
  settings: 'הגדרות',
};

export default function AdminAuditLog() {
  const [entityFilter, setEntityFilter] = useState('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', entityFilter],
    queryFn: async (): Promise<(AuditLog & { profile: Profile | null })[]> => {
      let q = supabase
        .from('audit_logs')
        .select('*, profile:profiles!audit_logs_actor_id_fkey(*)')
        .order('created_at', { ascending: false })
        .limit(300);
      if (entityFilter !== 'all') q = q.eq('entity_type', entityFilter);
      const { data, error } = await q;
      if (error) throw error;
      return data as unknown as (AuditLog & { profile: Profile | null })[];
    },
  });

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">Audit Log</h1>
        <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="w-56">
          <option value="all">כל סוגי הרשומות</option>
          {Object.entries(ENTITY_LABEL).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-brand-600" />
          </div>
        ) : !logs?.length ? (
          <EmptyState icon={ScrollText} title="אין רשומות" />
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-800">
            {logs.map((log) => (
              <div key={log.id}>
                <button
                  onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-right transition hover:bg-ink-50 dark:hover:bg-ink-800/40"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-800 dark:text-ink-100">
                      {ACTION_LABEL[log.action] ?? log.action}
                      <span className="mr-2 text-xs font-normal text-ink-400">{ENTITY_LABEL[log.entity_type] ?? log.entity_type}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                      {log.profile?.full_name ?? 'מערכת'} · {formatDateTimeHe(log.created_at)}
                    </p>
                  </div>
                  <ChevronDown className={`size-4 shrink-0 text-ink-400 transition-transform ${expanded === log.id ? 'rotate-180' : ''}`} />
                </button>
                {expanded === log.id && (
                  <div className="grid gap-3 bg-ink-50/60 px-5 py-4 text-xs sm:grid-cols-2 dark:bg-ink-800/20">
                    <div>
                      <p className="mb-1 font-bold text-ink-500 dark:text-ink-400">לפני</p>
                      <pre className="overflow-x-auto rounded-lg bg-white p-3 text-ink-700 dark:bg-ink-900 dark:text-ink-200">
                        {log.old_value ? JSON.stringify(log.old_value, null, 2) : '—'}
                      </pre>
                    </div>
                    <div>
                      <p className="mb-1 font-bold text-ink-500 dark:text-ink-400">אחרי</p>
                      <pre className="overflow-x-auto rounded-lg bg-white p-3 text-ink-700 dark:bg-ink-900 dark:text-ink-200">
                        {log.new_value ? JSON.stringify(log.new_value, null, 2) : '—'}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
