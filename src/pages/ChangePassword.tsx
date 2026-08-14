import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Input, FormGroup } from '../components/ui/Field';
import { Card } from '../components/ui/Card';

export default function ChangePassword() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  if (profile && !profile.must_change_password) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/'} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('הסיסמה חייבת להכיל לפחות 8 תווים');
      return;
    }
    if (password !== confirm) {
      toast.error('הסיסמאות אינן תואמות');
      return;
    }
    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) {
      toast.error('עדכון הסיסמה נכשל: ' + authError.message);
      setLoading(false);
      return;
    }
    await supabase.from('profiles').update({ must_change_password: false }).eq('id', profile!.id);
    await refreshProfile();
    toast.success('הסיסמה עודכנה בהצלחה');
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10">
            <KeyRound className="size-6" />
          </div>
          <h1 className="text-lg font-bold text-ink-900 dark:text-ink-50">נדרש עדכון סיסמה</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">זו הפעם הראשונה שאתה מתחבר - יש להגדיר סיסמה חדשה</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormGroup label="סיסמה חדשה" required>
            <Input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormGroup>
          <FormGroup label="אימות סיסמה" required>
            <Input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </FormGroup>
          <Button type="submit" loading={loading} fullWidth>
            עדכון סיסמה
          </Button>
        </form>
      </Card>
    </div>
  );
}
