type EmptyStateProps = {
  title?: string
  message?: string
}

export function EmptyState({
  title = 'No signals match the current filters.',
  message = 'Try clearing search, source, group, category, or trust tier filters.',
}: EmptyStateProps) {
  return (
    <div className="terminal-panel p-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-muted-fg">{title}</p>
      <p className="mt-2 text-sm text-muted-fg">{message}</p>
    </div>
  )
}
