import type { SignalItem } from '../types/signals'
import { buildFeedSourceFilters, countSignalsForSource } from '../lib/sourceFilters'

type SourceHealthPanelProps = {
  signals: SignalItem[]
}

export function SourceHealthPanel({ signals }: SourceHealthPanelProps) {
  const sourceFilters = buildFeedSourceFilters(signals).filter((filter) => filter.id !== 'all')

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-grid-border py-2 font-mono text-[11px] uppercase tracking-[0.08em]">
      {sourceFilters.length === 0 && <span className="text-muted-fg">No source health until real signals are loaded.</span>}
      {sourceFilters.map((source) => {
        const count = countSignalsForSource(signals, source.id)

        return (
          <span className="text-muted-fg" key={source.id}>
            <span className="text-cyan">•</span> {source.label}
            <span className="ml-1 text-primary-fg">— {count}</span>
          </span>
        )
      })}
    </div>
  )
}
