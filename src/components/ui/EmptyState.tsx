import type { LucideIcon } from 'lucide-react';

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-ink-800">
        <Icon className="size-7" />
      </div>
      <div>
        <p className="font-semibold text-ink-800 dark:text-ink-100">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>}
      </div>
      {action}
    </div>
  );
}
