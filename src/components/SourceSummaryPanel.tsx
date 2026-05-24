import { summarizeSources } from '../lib/scoring'
import type { SourceStatus } from '../types/sources'

type SourceSummaryPanelProps = {
  sources: SourceStatus[]
}

const labels = [
  ['live', 'LIVE'],
  ['degraded', 'DEGRADED'],
  ['offline', 'OFFLINE'],
  ['auth_needed', 'AUTH NEEDED'],
  ['limited', 'LIMITED'],
  ['planned', 'PLANNED'],
] as const

export function SourceSummaryPanel({ sources }: SourceSummaryPanelProps) {
  const summary = summarizeSources(sources)

  return (
    <section className="terminal-panel p-4">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.22em] text-muted-fg">Source Summary</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {labels.map(([key, label]) => (
          <div key={key} className="rounded border border-grid-border bg-surface px-3 py-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-fg">{label}</div>
            <div className="mt-1 font-mono text-xl text-primary-fg">{summary[key]}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
