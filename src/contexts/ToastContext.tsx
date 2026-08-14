import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastKind = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastContextValue {
  show: (message: string, kind?: ToastKind) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'border-success-500/30 bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-500',
  error: 'border-danger-500/30 bg-danger-50 text-danger-600 dark:bg-danger-500/10 dark:text-danger-500',
  info: 'border-brand-500/30 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300',
};

const KIND_ICON: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, kind, message }]);
      setTimeout(() => dismiss(id), 5000);
    },
    [dismiss],
  );

  const value: ToastContextValue = {
    show,
    success: (message) => show(message, 'success'),
    error: (message) => show(message, 'error'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6">
        {toasts.map((t) => {
          const Icon = KIND_ICON[t.kind];
          return (
            <div
              key={t.id}
              className={`animate-slide-up flex w-full max-w-sm items-start gap-2 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm ${KIND_STYLES[t.kind]}`}
              role="status"
            >
              <Icon className="mt-0.5 size-5 shrink-0" />
              <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 rounded-md p-0.5 opacity-60 transition hover:opacity-100"
                aria-label="סגור"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
