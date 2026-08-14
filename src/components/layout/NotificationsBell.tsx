import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, AlertTriangle, Clock, Inbox, CalendarDays, LockOpen } from 'lucide-react';
import { useNotifications, type AppNotification } from '../../hooks/useNotifications';

const ICONS: Record<AppNotification['kind'], typeof Bell> = {
  open_session: Clock,
  missing_report: AlertTriangle,
  pending_correction: Inbox,
  pending_absence: CalendarDays,
  month_open: LockOpen,
};

export function NotificationsBell() {
  const { data: notifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const count = notifications?.length ?? 0;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-lg p-2 text-ink-500 transition hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
      >
        <Bell className="size-5" />
        {count > 0 && (
          <span className="absolute -left-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-danger-500 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>

      {open && (
        <>
          <button className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} aria-label="סגור" />
          <div className="animate-scale-in absolute left-0 top-full z-50 mt-2 w-80 origin-top-left rounded-2xl border border-ink-200 bg-white p-2 shadow-xl dark:border-ink-800 dark:bg-ink-900">
            <p className="px-3 py-2 text-xs font-bold text-ink-400">התראות</p>
            {!notifications?.length ? (
              <p className="px-3 py-6 text-center text-sm text-ink-400">אין התראות חדשות</p>
            ) : (
              <div className="flex max-h-80 flex-col gap-0.5 overflow-y-auto">
                {notifications.map((n) => {
                  const Icon = ICONS[n.kind];
                  return (
                    <button
                      key={n.id}
                      onClick={() => {
                        setOpen(false);
                        navigate(n.href);
                      }}
                      className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-right text-sm text-ink-700 transition hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-ink-800"
                    >
                      <Icon className="mt-0.5 size-4 shrink-0 text-brand-500" />
                      {n.message}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
