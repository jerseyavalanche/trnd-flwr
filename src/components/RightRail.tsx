import { sourceUniverse } from '../data/sourceUniverse'
import { formatRelativeTime } from '../lib/time'
import type { SignalItem } from '../types/signals'
import type { SourceStatus } from '../types/sources'

type RightRailProps = {
  failed: number
  healthy: number
  lastPullAt: string | null
  signals: SignalItem[]
  sourceStatuses: SourceStatus[]
}

const topNarratives = (signals: SignalItem[]) => {
  const counts = new Map<string, number>()
  signals.forEach((signal) => {
    const key = signal.category.toUpperCase()
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
}

export function RightRail({ failed, healthy, lastPullAt, signals, sourceStatuses }: RightRailProps) {
  const connectedSources = sourceStatuses.filter((source) => source.status === 'live').length
  const publicSources = sourceUniverse.filter((source) => source.status === 'public_feed_possible' || source.status === 'scrape_possible').length
  const paidSources = sourceUniverse.filter((source) => source.status === 'paid_vendor_access_needed').length
  const narratives = topNarratives(signals)

  return (
    <aside className="space-y-2 pb-24">
      <section className="border border-grid-border bg-surface/50 p-2 font-mono">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-fg">Source Status</p>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] uppercase tracking-[0.08em] text-muted-fg">
          <span className="border border-grid-border bg-app-bg px-2 py-1">HEALTHY:{healthy}</span>
          <span className="border border-grid-border bg-app-bg px-2 py-1">FAILED:{failed}</span>
          <span className="col-span-2 border border-grid-border bg-app-bg px-2 py-1">
            LAST:{lastPullAt ? formatRelativeTime(lastPullAt) : 'NEVER'}
          </span>
        </div>
      </section>

      <section className="border border-grid-border bg-surface/50 p-2 font-mono">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-fg">Top Narratives</p>
        <div className="mt-2 space-y-1 text-[10px] uppercase tracking-[0.08em] text-muted-fg">
          {narratives.length === 0 ? (
            <p>No real narratives yet.</p>
          ) : (
            narratives.map(([label, count]) => (
              <p className="flex justify-between gap-2" key={label}>
                <span>{label}</span>
                <span className="text-primary-fg">{count}</span>
              </p>
            ))
          )}
        </div>
      </section>

      <section className="border border-grid-border bg-surface/50 p-2 font-mono">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-fg">Market Pulse</p>
        <p className="mt-2 text-[10px] uppercase leading-4 tracking-[0.08em] text-warn-amber">
          Ticker unavailable: connect market data source.
        </p>
      </section>

      <section className="border border-grid-border bg-surface/50 p-2 font-mono">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary-fg">Source Matrix Snapshot</p>
        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] uppercase tracking-[0.08em] text-muted-fg">
          <span className="border border-grid-border bg-app-bg px-2 py-1">CONNECTED:{connectedSources}</span>
          <span className="border border-grid-border bg-app-bg px-2 py-1">PUBLIC:{publicSources}</span>
          <span className="border border-grid-border bg-app-bg px-2 py-1">PAID:{paidSources}</span>
          <span className="border border-grid-border bg-app-bg px-2 py-1">TOTAL:{sourceUniverse.length}</span>
        </div>
      </section>
    </aside>
  )
}
