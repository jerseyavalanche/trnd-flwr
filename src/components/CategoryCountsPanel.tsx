import { countUiCategories } from '../lib/categories'
import type { SignalItem } from '../types/signals'

type CategoryCountsPanelProps = {
  signals: SignalItem[]
}

export function CategoryCountsPanel({ signals }: CategoryCountsPanelProps) {
  const counts = countUiCategories(signals)

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-grid-border py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-fg">
      {Object.entries(counts).map(([label, count]) => (
        <span key={label}>
          {label} <span className="text-primary-fg">{count}</span>
        </span>
      ))}
    </div>
  )
}
