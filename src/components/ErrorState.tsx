type ErrorStateProps = {
  message: string
}

export function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="terminal-panel border-offline-red/40 bg-offline-red/5 p-4">
      <p className="font-mono text-xs uppercase tracking-[0.22em] text-offline-red">Data path degraded</p>
      <p className="mt-2 text-sm text-muted-fg">{message}</p>
    </div>
  )
}
