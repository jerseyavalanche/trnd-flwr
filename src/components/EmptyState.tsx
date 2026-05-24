type EmptyStateProps = {
  title?: string
  message?: string
}

export function EmptyState({
  title = 'No real signals have been ingested yet.',
  message = 'Connect sources or click Ingest New Signals. No fake headlines, whale moves, or trader profiles are shown.',
}: EmptyStateProps) {
  return (
    <div className="terminal-panel p-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-fg">{title}</p>
      <p className="mt-2 text-sm text-muted-fg">{message}</p>
    </div>
  )
}
