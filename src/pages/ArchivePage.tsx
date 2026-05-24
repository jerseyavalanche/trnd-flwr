import { useCallback, useEffect, useState } from 'react'
import { fetchSignals } from '../lib/api'
import { SIGNAL_PAGE_SIZE } from '../lib/feedLimits'
import { formatRelativeTime } from '../lib/time'
import type { SignalItem } from '../types/signals'

const formatArchiveTimestamp = (isoDate?: string) => {
  if (!isoDate) return 'unknown'
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return 'unknown'
  return date.toISOString().replace('T', ' ').slice(0, 16) + 'Z'
}

export function ArchivePage() {
  const [signals, setSignals] = useState<SignalItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string>()

  const loadPage = useCallback(async (offset: number, reset: boolean) => {
    if (reset) setLoading(true)
    else setLoadingMore(true)

    const result = await fetchSignals({ limit: SIGNAL_PAGE_SIZE, offset })
    setSignals((current) => {
      if (reset) return result.signals
      const byId = new Map(current.map((signal) => [signal.id, signal]))
      for (const signal of result.signals) byId.set(signal.id, signal)
      return Array.from(byId.values())
    })
    setTotal(result.total ?? result.signals.length)
    setError(result.error)
    setLoading(false)
    setLoadingMore(false)
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(0, true))
  }, [loadPage])

  const hasMore = signals.length < total

  return (
    <div className="min-h-screen bg-[#050b0d] px-4 py-3 font-mono text-primary-fg">
      <header className="border-b border-grid-border pb-2">
        <a className="text-[11px] uppercase tracking-[0.14em] text-cyan hover:underline" href="/">
          ← Back to signals
        </a>
        <h1 className="mt-2 text-sm uppercase tracking-[0.16em] text-cyan">Archived links</h1>
        <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-muted-fg">
          Real ingested URLs kept after newer pulls. {signals.length}/{total || signals.length} loaded.
        </p>
      </header>

      {loading && <p className="py-6 text-[11px] uppercase tracking-[0.14em] text-muted-fg">Loading archive...</p>}
      {error && <p className="py-2 text-[11px] uppercase tracking-[0.14em] text-warn-amber">{error}</p>}

      {!loading && signals.length === 0 && (
        <p className="py-6 text-[11px] uppercase tracking-[0.14em] text-muted-fg">No archived links yet.</p>
      )}

      <ul className="divide-y divide-grid-border">
        {signals.map((signal) => (
          <li className="py-2" key={signal.id}>
            <a
              className="block truncate text-[12px] text-cyan hover:underline"
              href={signal.url}
              rel="noreferrer"
              target="_blank"
            >
              {signal.title}
            </a>
            <p className="mt-0.5 truncate text-[10px] uppercase tracking-[0.1em] text-muted-fg">
              {signal.sourceLabel}
              {signal.domain ? ` · ${signal.domain}` : ''}
              {` · ingested ${formatArchiveTimestamp(signal.ingestedAt)}`}
              {signal.ingestedAt ? ` (${formatRelativeTime(signal.ingestedAt)})` : ''}
              {signal.publishedAt ? ` · published ${formatArchiveTimestamp(signal.publishedAt)} (${formatRelativeTime(signal.publishedAt)})` : ''}
            </p>
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          className="mb-8 mt-3 w-full border border-grid-border px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted-fg transition hover:border-cyan hover:text-cyan disabled:opacity-50"
          disabled={loadingMore}
          onClick={() => void loadPage(signals.length, false)}
          type="button"
        >
          {loadingMore ? 'Loading...' : `Load more (${signals.length}/${total})`}
        </button>
      )}
    </div>
  )
}
