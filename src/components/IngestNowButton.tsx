type IngestNowButtonProps = {
  loading: boolean
  onIngest: () => void
}

export function IngestNowButton({ loading, onIngest }: IngestNowButtonProps) {
  return (
    <button
      className="border border-grid-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-fg transition hover:border-cyan hover:text-cyan disabled:opacity-50"
      disabled={loading}
      onClick={onIngest}
      type="button"
    >
      {loading ? 'PULLING...' : 'PULL_ENABLED_SOURCES'}
    </button>
  )
}
