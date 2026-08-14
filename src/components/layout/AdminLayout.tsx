import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Clock, Users, Inbox, CalendarDays, FileBarChart,
  Wallet, Settings, LogOut, Menu, X, Clock3, ScrollText,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePendingCounts } from '../../hooks/useAdminData';
import { NotificationsBell } from './NotificationsBell';

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'ראשי', end: true },
  { to: '/admin/attendance', icon: Clock, label: 'נוכחות' },
  { to: '/admin/employees', icon: Users, label: 'עובדים' },
  { to: '/admin/requests', icon: Inbox, label: 'בקשות', countKey: 'corrections' as const },
  { to: '/admin/absences', icon: CalendarDays, label: 'חופשות ומחלות', countKey: 'absences' as const },
  { to: '/admin/reports', icon: FileBarChart, label: 'דוחות' },
  { to: '/admin/payroll', icon: Wallet, label: 'שכר' },
  { to: '/admin/settings', icon: Settings, label: 'הגדרות' },
  { to: '/admin/audit-log', icon: ScrollText, label: 'Audit Log' },
];

export default function AdminLayout() {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: counts } = usePendingCounts();

  return (
    <div className="flex min-h-screen bg-ink-50 dark:bg-ink-950">
      <aside className="hidden w-64 shrink-0 flex-col border-l border-ink-200/70 bg-white dark:border-ink-800 dark:bg-ink-900 lg:flex">
        <SidebarContent counts={counts} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-ink-950/50" onClick={() => setMobileOpen(false)} aria-label="סגור תפריט" />
          <aside className="animate-slide-up absolute inset-y-0 right-0 flex w-72 flex-col bg-white shadow-2xl dark:bg-ink-900">
            <SidebarContent counts={counts} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200/70 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-ink-800 dark:bg-ink-900/90 lg:hidden">
          <button onClick={() => setMobileOpen(true)} className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-100 dark:hover:bg-ink-800">
            <Menu className="size-5" />
          </button>
          <p className="text-sm font-bold text-ink-800 dark:text-ink-100">Ayalon Kedem Time</p>
          <NotificationsBell />
        </header>

        <div className="hidden items-center justify-between border-b border-ink-200/70 bg-white px-8 py-3 dark:border-ink-800 dark:bg-ink-900 lg:flex">
          <NotificationsBell />
          <div className="flex items-center gap-3">
            <div className="text-left">
              <p className="text-sm font-bold text-ink-800 dark:text-ink-100">{profile?.full_name}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400">מנהל מערכת</p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-800 dark:text-ink-400 dark:hover:bg-ink-800"
            >
              <LogOut className="size-4" />
              יציאה
            </button>
          </div>
        </div>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  counts,
  onNavigate,
}: {
  counts?: { corrections: number; absences: number };
  onNavigate?: () => void;
}) {
  const { profile, signOut } = useAuth();
  return (
    <>
      <div className="flex items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-ink-900 text-brand-400 dark:bg-ink-800">
            <Clock3 className="size-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-ink-900 dark:text-ink-50">Ayalon Kedem</p>
            <p className="text-xs text-ink-400">Time Management</p>
          </div>
        </div>
        {onNavigate && (
          <button onClick={onNavigate} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800">
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end, countKey }) => {
          const count = countKey ? counts?.[countKey] : undefined;
          return (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
                    : 'text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800'
                }`
              }
            >
              <span className="flex items-center gap-2.5">
                <Icon className="size-4.5" />
                {label}
              </span>
              {Boolean(count) && (
                <span className="rounded-full bg-danger-500 px-1.5 py-0.5 text-[10px] font-bold text-white">{count}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-ink-100 p-4 dark:border-ink-800 lg:hidden">
        <p className="text-sm font-bold text-ink-800 dark:text-ink-100">{profile?.full_name}</p>
        <button
          onClick={() => signOut()}
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-ink-500 dark:text-ink-400"
        >
          <LogOut className="size-4" />
          יציאה
        </button>
      </div>
    </>
  );
}
