import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300',
  secondary:
    'bg-white text-ink-700 border border-ink-200 shadow-sm hover:bg-ink-50 active:bg-ink-100 dark:bg-ink-900 dark:text-ink-200 dark:border-ink-700 dark:hover:bg-ink-800',
  ghost: 'text-ink-600 hover:bg-ink-100 active:bg-ink-200 dark:text-ink-300 dark:hover:bg-ink-800',
  danger: 'bg-danger-600 text-white shadow-sm hover:bg-danger-500 active:bg-danger-700 disabled:bg-danger-300',
  success:
    'bg-success-600 text-white shadow-sm shadow-success-600/20 hover:bg-success-500 active:bg-success-700 disabled:bg-success-300',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-base gap-2 rounded-xl',
  xl: 'h-16 px-8 text-lg gap-3 rounded-2xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={clsx(
          'inline-flex items-center justify-center font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-70 active:scale-[0.98]',
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          fullWidth && 'w-full',
          className,
        )}
        {...rest}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = 'Button';
