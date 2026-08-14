import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { usePayrollRules, useCompanyInfo } from '../../hooks/useSettings';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, FormGroup } from '../../components/ui/Field';
import type { CompanyInfo, PayrollRules } from '../../types/database';

export default function AdminSettings() {
  const { data: rules } = usePayrollRules();
  const { data: company } = useCompanyInfo();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<PayrollRules | null>(null);
  const [companyForm, setCompanyForm] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    if (rules) setForm(rules);
  }, [rules]);
  useEffect(() => {
    if (company) setCompanyForm(company);
  }, [company]);

  const saveRulesMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('update_setting', { p_key: 'payroll_rules', p_value: form });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('הגדרות השכר עודכנו');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveCompanyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('update_setting', { p_key: 'company_info', p_value: companyForm });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('פרטי החברה עודכנו');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!form || !companyForm) return null;

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink-900 dark:text-ink-50">הגדרות</h1>

      <Card>
        <CardHeader title="פרטי החברה" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup label="שם החברה">
              <Input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
            </FormGroup>
            <FormGroup label="אזור זמן">
              <Input value={companyForm.timezone} onChange={(e) => setCompanyForm({ ...companyForm, timezone: e.target.value })} />
            </FormGroup>
          </div>
          <Button className="mt-4" loading={saveCompanyMutation.isPending} onClick={() => saveCompanyMutation.mutate()}>
            <Save className="size-4" />
            שמירה
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="חוקי שכר ושעות נוספות" subtitle="ניתן להתאים את הכללים לצרכי העסק - אינם מהווים ייעוץ משפטי" />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormGroup label="שעות עבודה רגילות ביום" hint="מעבר לכך נחשב שעות נוספות">
              <Input type="number" min={1} max={24} value={form.standardDailyHours} onChange={(e) => setForm({ ...form, standardDailyHours: Number(e.target.value) })} />
            </FormGroup>
            <FormGroup label="שעות עבודה רגילות בשבוע" hint="לשימוש עתידי בחישובים מבוססי שבוע">
              <Input type="number" min={1} max={80} value={form.standardWeeklyHours} onChange={(e) => setForm({ ...form, standardWeeklyHours: Number(e.target.value) })} />
            </FormGroup>
            <FormGroup label="מספר שעות נוספות במדרגה ראשונה">
              <Input type="number" min={0} step="0.5" value={form.overtimeTier1Hours} onChange={(e) => setForm({ ...form, overtimeTier1Hours: Number(e.target.value) })} />
            </FormGroup>
            <FormGroup label="תעריף מדרגה ראשונה (מכפיל)">
              <Input type="number" min={1} step="0.05" value={form.overtimeTier1Rate} onChange={(e) => setForm({ ...form, overtimeTier1Rate: Number(e.target.value) })} />
            </FormGroup>
            <FormGroup label="תעריף מדרגה שנייה (מכפיל)" hint="לכל שעה נוספת מעבר למדרגה הראשונה">
              <Input type="number" min={1} step="0.05" value={form.overtimeTier2Rate} onChange={(e) => setForm({ ...form, overtimeTier2Rate: Number(e.target.value) })} />
            </FormGroup>
            <FormGroup label="דקות הפסקה מינימליות (לא בתשלום)">
              <Input type="number" min={0} value={form.minBreakMinutesUnpaid} onChange={(e) => setForm({ ...form, minBreakMinutesUnpaid: Number(e.target.value) })} />
            </FormGroup>
          </div>

          <label className="mt-4 flex items-center gap-2.5 text-sm font-medium text-ink-700 dark:text-ink-200">
            <input
              type="checkbox"
              checked={form.breaksArePaid}
              onChange={(e) => setForm({ ...form, breaksArePaid: e.target.checked })}
              className="size-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            הפסקות נחשבות כחלק משעות העבודה (בתשלום)
          </label>

          <Button className="mt-5" loading={saveRulesMutation.isPending} onClick={() => saveRulesMutation.mutate()}>
            <Save className="size-4" />
            שמירת הגדרות
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
