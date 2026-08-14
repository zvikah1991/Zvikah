import { useState, type FormEvent } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { Clock3, Lock, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, FormGroup } from '../components/ui/Field';

export default function Login() {
  const { session, profile, signIn } = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (session && profile) {
    return <Navigate to={profile.role === 'admin' ? '/admin' : '/'} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) setError(error);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-ink-50 to-ink-100 px-4 dark:from-ink-950 dark:to-ink-900">
      <div className="animate-scale-in w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-ink-900 text-brand-400 shadow-lg dark:bg-ink-800">
            <Clock3 className="size-7" />
          </div>
          <h1 className="text-xl font-extrabold text-ink-900 dark:text-ink-50">Ayalon Kedem Time</h1>
          <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">ניהול נוכחות ושעות עבודה</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-200/70 bg-white p-6 shadow-xl dark:border-ink-800 dark:bg-ink-900">
          {params.get('inactive') && (
            <div className="mb-4 rounded-xl bg-warning-50 px-3.5 py-2.5 text-sm font-medium text-warning-600 dark:bg-warning-500/10">
              המשתמש אינו פעיל. פנה למנהל המערכת.
            </div>
          )}
          <div className="flex flex-col gap-4">
            <FormGroup label="אימייל" required>
              <div className="relative">
                <Mail className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <Input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10"
                  placeholder="name@company.co.il"
                />
              </div>
            </FormGroup>
            <FormGroup label="סיסמה" required>
              <div className="relative">
                <Lock className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  placeholder="••••••••"
                />
              </div>
            </FormGroup>

            {error && (
              <p className="rounded-xl bg-danger-50 px-3.5 py-2.5 text-sm font-medium text-danger-600 dark:bg-danger-500/10">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" loading={loading} fullWidth>
              התחברות
            </Button>
          </div>
        </form>
        <p className="mt-6 text-center text-xs text-ink-400">קיבלת פרטי גישה מהמנהל? השתמש בהם להתחברות.</p>
      </div>
    </div>
  );
}
