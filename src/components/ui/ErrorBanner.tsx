export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="animate-fade-up flex items-start gap-3 rounded-xl border border-[var(--status-critical)]/30 bg-[color-mix(in_oklab,var(--status-critical)_10%,transparent)] px-4 py-3 text-sm">
      <span className="text-[var(--status-critical)]">⚠</span>
      <p className="flex-1 text-[var(--text-primary)]">{message}</p>
      <button type="button" onClick={onDismiss} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
        ✕
      </button>
    </div>
  );
}
