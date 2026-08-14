import { NavLink, Outlet } from 'react-router-dom';
import { Home, Clock, FileEdit, CalendarDays, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'בית', end: true },
  { to: '/my-hours', icon: Clock, label: 'השעות שלי' },
  { to: '/correction', icon: FileEdit, label: 'בקשת תיקון' },
  { to: '/absences', icon: CalendarDays, label: 'חופשות' },
];

export default function EmployeeLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-ink-50 pb-20 dark:bg-ink-950 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-white/90 backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/90">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div>
            <p className="text-sm font-bold text-ink-900 dark:text-ink-50">{profile?.full_name}</p>
            <p className="text-xs text-ink-500 dark:text-ink-400">{profile?.job_title || 'עובד'}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800"
          >
            <LogOut className="size-4" />
            יציאה
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200/70 bg-white/95 backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/95 sm:hidden">
        <div className="mx-auto flex max-w-2xl items-stretch justify-around">
          {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400'
                }`
              }
            >
              <Icon className="size-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
