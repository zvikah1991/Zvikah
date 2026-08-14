import { clsx } from 'clsx';

type Tone = 'success' | 'gray' | 'warning' | 'danger' | 'brand';

const TONE_CLASSES: Record<Tone, string> = {
  success: 'bg-success-50 text-success-600 ring-success-500/20 dark:bg-success-500/10 dark:text-success-500',
  gray: 'bg-ink-100 text-ink-600 ring-ink-500/15 dark:bg-ink-800 dark:text-ink-300',
  warning: 'bg-warning-50 text-warning-600 ring-warning-500/20 dark:bg-warning-500/10 dark:text-warning-500',
  danger: 'bg-danger-50 text-danger-600 ring-danger-500/20 dark:bg-danger-500/10 dark:text-danger-500',
  brand: 'bg-brand-50 text-brand-700 ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300',
};

export function Badge({
  tone = 'gray',
  dot,
  children,
  className,
}: {
  tone?: Tone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && <span className={clsx('size-1.5 rounded-full', DOT_CLASSES[tone])} />}
      {children}
    </span>
  );
}

const DOT_CLASSES: Record<Tone, string> = {
  success: 'bg-success-500',
  gray: 'bg-ink-400',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
  brand: 'bg-brand-500',
};

export type EmployeeLiveStatus = 'working' | 'break' | 'off' | 'missing';

export function StatusPill({ status }: { status: EmployeeLiveStatus }) {
  const map: Record<EmployeeLiveStatus, { tone: Tone; label: string }> = {
    working: { tone: 'success', label: 'בעבודה' },
    break: { tone: 'warning', label: 'בהפסקה' },
    off: { tone: 'gray', label: 'לא בעבודה' },
    missing: { tone: 'danger', label: 'דיווח חסר' },
  };
  const { tone, label } = map[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
