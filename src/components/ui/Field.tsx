import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { clsx } from 'clsx';

const baseClasses =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:bg-ink-100 disabled:text-ink-400 dark:border-ink-700 dark:bg-ink-800 dark:text-ink-50 dark:disabled:bg-ink-900';

export function FormGroup({
  label,
  error,
  hint,
  children,
  required,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-ink-700 dark:text-ink-200">
        {label}
        {required && <span className="text-danger-500"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-ink-500 dark:text-ink-400">{hint}</p>}
      {error && <p className="text-xs font-medium text-danger-600 dark:text-danger-500">{error}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} className={clsx(baseClasses, className)} {...rest} />
  ),
);
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea ref={ref} className={clsx(baseClasses, 'min-h-24 resize-y', className)} {...rest} />
  ),
);
Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...rest }, ref) => (
    <select ref={ref} className={clsx(baseClasses, 'appearance-none bg-no-repeat', className)} {...rest}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';
