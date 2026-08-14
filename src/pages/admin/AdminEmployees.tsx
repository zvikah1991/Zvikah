import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, UserX, UserCheck, KeyRound, Copy, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { useEmployees } from '../../hooks/useAdminData';
import { adminCreateEmployee, adminSetEmployeeActive, adminResetPassword, type CreateEmployeeInput } from '../../lib/edgeFunctions';
import { formatDateHe } from '../../lib/time';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Select, FormGroup } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import type { EmploymentType, Profile } from '../../types/database';

const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  hourly: 'שעתי',
  monthly: 'חודשי',
  contractor: 'קבלן',
};

const emptyForm: CreateEmployeeInput = {
  email: '', full_name: '', phone: '', job_title: '', hire_date: '',
  employment_type: 'hourly', hourly_wage: undefined, employment_scope: 100,
};

export default function AdminEmployees() {
  const { data: employees, isLoading } = useEmployees();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateEmployeeInput>(emptyForm);
  const [editEmployee, setEditEmployee] = useState<Profile | null>(null);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{ name: string; password: string } | null>(null);

  const createMutation = useMutation({
    mutationFn: () => adminCreateEmployee(createForm),
    onSuccess: (result) => {
      toast.success('העובד נוצר בהצלחה');
      setCreateOpen(false);
      setTempPasswordInfo({ name: createForm.full_name, password: result.tempPassword });
      setCreateForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const editMutation = useMutation({
    mutationFn: async (profile: Profile) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          job_title: profile.job_title,
          hire_date: profile.hire_date,
          employment_type: profile.employment_type,
          hourly_wage: profile.hourly_wage,
          employment_scope: profile.employment_scope,
        })
        .eq('id', profile.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('פרטי העובד עודכנו');
      setEditEmployee(null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (p: Profile) => adminSetEmployeeActive(p.id, !p.active),
    onSuccess: (_r, p) => {
      toast.success(p.active ? 'העובד הושבת' : 'העובד הופעל מחדש');
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['live-employees'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (p: Profile) => adminResetPassword(p.id),
    onSuccess: (result, p) => setTempPasswordInfo({ name: p.full_name, password: result.tempPassword }),
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">עובדים</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          הוספת עובד
        </Button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner className="text-brand-600" />
          </div>
        ) : !employees?.length ? (
          <EmptyState icon={Users} title="אין עובדים עדיין" action={<Button onClick={() => setCreateOpen(true)}>הוספת עובד ראשון</Button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-ink-50/70 text-xs font-semibold text-ink-500 dark:border-ink-800 dark:bg-ink-800/40 dark:text-ink-400">
                  <th className="px-4 py-3 text-right">שם</th>
                  <th className="px-4 py-3 text-right">תפקיד</th>
                  <th className="px-4 py-3 text-right">טלפון</th>
                  <th className="px-4 py-3 text-right">סוג העסקה</th>
                  <th className="px-4 py-3 text-right">שכר שעתי</th>
                  <th className="px-4 py-3 text-right">תחילת עבודה</th>
                  <th className="px-4 py-3 text-right">סטטוס</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-ink-800">
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td className="whitespace-nowrap px-4 py-2.5 font-semibold text-ink-800 dark:text-ink-100">
                      {emp.full_name}
                      <p className="text-xs font-normal text-ink-400">{emp.email}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink-600 dark:text-ink-300">{emp.job_title || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink-600 dark:text-ink-300">{emp.phone || '—'}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink-600 dark:text-ink-300">{EMPLOYMENT_LABEL[emp.employment_type]}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 font-mono text-ink-600 dark:text-ink-300">
                      {emp.hourly_wage ? `₪${emp.hourly_wage}` : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink-600 dark:text-ink-300">{emp.hire_date ? formatDateHe(emp.hire_date) : '—'}</td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <Badge tone={emp.active ? 'success' : 'gray'} dot>
                        {emp.active ? 'פעיל' : 'לא פעיל'}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditEmployee(emp)} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800" title="עריכה">
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => resetPasswordMutation.mutate(emp)}
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-brand-600 dark:hover:bg-ink-800"
                          title="איפוס סיסמה"
                        >
                          <KeyRound className="size-4" />
                        </button>
                        <button
                          onClick={() => toggleActiveMutation.mutate(emp)}
                          className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-danger-600 dark:hover:bg-ink-800"
                          title={emp.active ? 'השבתת עובד' : 'הפעלת עובד'}
                        >
                          {emp.active ? <UserX className="size-4" /> : <UserCheck className="size-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {createOpen && (
        <Modal open onClose={() => setCreateOpen(false)} title="הוספת עובד חדש">
          <div className="flex flex-col gap-4">
            <FormGroup label="שם מלא" required>
              <Input value={createForm.full_name} onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })} />
            </FormGroup>
            <FormGroup label="אימייל" required hint="ישמש להתחברות למערכת">
              <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            </FormGroup>
            <FormGroup label="טלפון">
              <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
            </FormGroup>
            <FormGroup label="תפקיד">
              <Input value={createForm.job_title} onChange={(e) => setCreateForm({ ...createForm, job_title: e.target.value })} />
            </FormGroup>
            <FormGroup label="תאריך תחילת עבודה">
              <Input type="date" value={createForm.hire_date} onChange={(e) => setCreateForm({ ...createForm, hire_date: e.target.value })} />
            </FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="סוג העסקה">
                <Select value={createForm.employment_type} onChange={(e) => setCreateForm({ ...createForm, employment_type: e.target.value as EmploymentType })}>
                  {Object.entries(EMPLOYMENT_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup label="שכר שעתי (₪)">
                <Input type="number" min={0} step="0.01" value={createForm.hourly_wage ?? ''} onChange={(e) => setCreateForm({ ...createForm, hourly_wage: e.target.value ? Number(e.target.value) : undefined })} />
              </FormGroup>
            </div>
            <FormGroup label="היקף משרה (%)">
              <Input type="number" min={0} max={100} value={createForm.employment_scope ?? ''} onChange={(e) => setCreateForm({ ...createForm, employment_scope: e.target.value ? Number(e.target.value) : undefined })} />
            </FormGroup>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setCreateOpen(false)}>
                ביטול
              </Button>
              <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()} disabled={!createForm.full_name || !createForm.email}>
                יצירת עובד
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {editEmployee && (
        <Modal open onClose={() => setEditEmployee(null)} title="עריכת פרטי עובד">
          <div className="flex flex-col gap-4">
            <FormGroup label="שם מלא" required>
              <Input value={editEmployee.full_name} onChange={(e) => setEditEmployee({ ...editEmployee, full_name: e.target.value })} />
            </FormGroup>
            <FormGroup label="טלפון">
              <Input value={editEmployee.phone ?? ''} onChange={(e) => setEditEmployee({ ...editEmployee, phone: e.target.value })} />
            </FormGroup>
            <FormGroup label="תפקיד">
              <Input value={editEmployee.job_title ?? ''} onChange={(e) => setEditEmployee({ ...editEmployee, job_title: e.target.value })} />
            </FormGroup>
            <FormGroup label="תאריך תחילת עבודה">
              <Input type="date" value={editEmployee.hire_date ?? ''} onChange={(e) => setEditEmployee({ ...editEmployee, hire_date: e.target.value })} />
            </FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="סוג העסקה">
                <Select value={editEmployee.employment_type} onChange={(e) => setEditEmployee({ ...editEmployee, employment_type: e.target.value as EmploymentType })}>
                  {Object.entries(EMPLOYMENT_LABEL).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </Select>
              </FormGroup>
              <FormGroup label="שכר שעתי (₪)">
                <Input type="number" min={0} step="0.01" value={editEmployee.hourly_wage ?? ''} onChange={(e) => setEditEmployee({ ...editEmployee, hourly_wage: e.target.value ? Number(e.target.value) : null })} />
              </FormGroup>
            </div>
            <FormGroup label="היקף משרה (%)">
              <Input type="number" min={0} max={100} value={editEmployee.employment_scope ?? ''} onChange={(e) => setEditEmployee({ ...editEmployee, employment_scope: e.target.value ? Number(e.target.value) : null })} />
            </FormGroup>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditEmployee(null)}>
                ביטול
              </Button>
              <Button loading={editMutation.isPending} onClick={() => editMutation.mutate(editEmployee)}>
                שמירה
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {tempPasswordInfo && (
        <Modal open onClose={() => setTempPasswordInfo(null)} title="סיסמה זמנית נוצרה">
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-600 dark:text-ink-300">
              שלח פרטים אלו ל<strong>{tempPasswordInfo.name}</strong> בערוץ מאובטח. הסיסמה תוצג פעם אחת בלבד.
            </p>
            <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50 px-4 py-3 font-mono text-lg font-bold text-ink-900 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50">
              {tempPasswordInfo.password}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tempPasswordInfo.password);
                  toast.success('הועתק ללוח');
                }}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-200 dark:hover:bg-ink-700"
              >
                <Copy className="size-4" />
              </button>
            </div>
            <Button onClick={() => setTempPasswordInfo(null)}>סגירה</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
