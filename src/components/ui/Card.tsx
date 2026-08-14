import type { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

export function Card({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        'rounded-2xl border border-ink-200/70 bg-white shadow-sm dark:border-ink-800 dark:bg-ink-900',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-start justify-between gap-3 px-5 pt-5', className)}>
      <div>
        <h3 className="text-base font-bold text-ink-900 dark:text-ink-50">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('p-5', className)}>{children}</div>;
}
