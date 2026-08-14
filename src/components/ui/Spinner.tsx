import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'size-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

export function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 dark:bg-ink-950">
      <Spinner className="size-8 text-brand-600" />
    </div>
  );
}
