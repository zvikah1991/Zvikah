import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/50 backdrop-blur-sm sm:items-center sm:p-4">
      <button
        aria-label="סגור"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
        tabIndex={-1}
      />
      <div
        className={`animate-slide-up relative max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl dark:bg-ink-900`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-900 dark:text-ink-50">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800"
          >
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
