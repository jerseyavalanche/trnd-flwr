import type { SortMode } from '../types/signals'

type SearchSortControlsProps = {
  hasRealScores: boolean
  search: string
  sortMode: SortMode
  onSearchChange: (value: string) => void
  onSortModeChange: (value: SortMode) => void
}

export function SearchSortControls({
  hasRealScores,
  search,
  sortMode,
  onSearchChange,
  onSortModeChange,
}: SearchSortControlsProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-grid-border py-2 sm:flex-row sm:items-center">
      <input
        className="min-h-8 flex-1 border border-grid-border bg-app-bg px-3 py-1.5 text-[12px] uppercase tracking-[0.08em] text-primary-fg outline-none placeholder:text-muted-fg focus:border-cyan"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="SEARCH TITLE / DOMAIN / SUMMARY.."
        value={search}
      />
      <select
        className="min-h-8 border border-grid-border bg-app-bg px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-primary-fg outline-none focus:border-cyan disabled:opacity-50"
        onChange={(event) => onSortModeChange(event.target.value as typeof sortMode)}
        value={sortMode}
      >
        <option value="ingested">Newest Ingested</option>
        <option value="published">Newest Published</option>
        <option value="importance">Highest Importance</option>
        <option disabled={!hasRealScores} value="confidence">
          Highest Confidence
        </option>
        <option value="repeated_symbol">Most Repeated Symbol</option>
        <option value="active_source">Most Active Source</option>
      </select>
    </div>
  )
}
