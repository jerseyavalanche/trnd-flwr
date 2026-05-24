import { buildFeedSourceFilters, countSignalsForSource } from '../lib/sourceFilters'
import type { SignalItem } from '../types/signals'

type SourceFilterBarProps = {
  signals: SignalItem[]
  selected: string
  onChange: (value: string) => void
}

export function SourceFilterBar({ signals, selected, onChange }: SourceFilterBarProps) {
  const feedSourceFilters = buildFeedSourceFilters(signals)

  return (
    <div className="grid grid-cols-2 gap-2 border-b border-grid-border pb-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {feedSourceFilters.map((filter) => {
        const count = countSignalsForSource(signals, filter.id)
        const active = selected === filter.id

        return (
          <button
            className={`border px-2 py-1.5 text-left font-mono text-[10px] uppercase tracking-[0.08em] ${
              active
                ? 'border-gold bg-gold/10 text-gold'
                : 'border-grid-border text-muted-fg hover:border-cyan/40 hover:text-primary-fg'
            }`}
            key={filter.id}
            onClick={() => onChange(filter.id)}
            type="button"
          >
            {filter.label} <span className={active ? 'text-gold' : 'text-primary-fg'}>{count}</span>
          </button>
        )
      })}
    </div>
  )
}
