import { AlertTriangle } from 'lucide-react';

export default function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4 dark:bg-ink-950">
      <div className="max-w-md rounded-2xl border border-warning-500/30 bg-white p-8 text-center shadow-lg dark:bg-ink-900">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-warning-50 text-warning-600 dark:bg-warning-500/10">
          <AlertTriangle className="size-7" />
        </div>
        <h1 className="text-lg font-bold text-ink-900 dark:text-ink-50">המערכת טרם הוגדרה</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          יש להגדיר את משתני הסביבה <code className="rounded bg-ink-100 px-1.5 py-0.5 dark:bg-ink-800">VITE_SUPABASE_URL</code> ו-
          <code className="rounded bg-ink-100 px-1.5 py-0.5 dark:bg-ink-800">VITE_SUPABASE_ANON_KEY</code> כדי לחבר את האפליקציה
          לפרויקט Supabase. פרטים מלאים בקובץ README.
        </p>
      </div>
    </div>
  );
}
