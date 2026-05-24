import type { SortMode } from '../types/signals'

type SearchSortControlsProps = {
  search: string
  sortMode: SortMode
  onSearchChange: (value: string) => void
  onSortModeChange: (value: SortMode) => void
}

export function SearchSortControls({ search, sortMode, onSearchChange, onSortModeChange }: SearchSortControlsProps) {
  return (
    <div className="flex flex-col gap-2 border-b border-grid-border py-3 sm:flex-row sm:items-center">
      <input
        className="min-h-8 flex-1 border border-grid-border bg-app-bg px-3 py-1.5 text-[12px] uppercase tracking-[0.08em] text-primary-fg outline-none placeholder:text-muted-fg focus:border-cyan"
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="SEARCH TITLES.."
        value={search}
      />
      <div className="flex gap-2">
        <button
          className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] ${
            sortMode === 'time' ? 'border-cyan text-cyan' : 'border-grid-border text-muted-fg'
          }`}
          onClick={() => onSortModeChange('time')}
          type="button"
        >
          SORT:TIME
        </button>
        <button
          className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] ${
            sortMode === 'score' ? 'border-cyan text-cyan' : 'border-grid-border text-muted-fg'
          }`}
          onClick={() => onSortModeChange('score')}
          type="button"
        >
          SORT:SCORE
        </button>
      </div>
    </div>
  )
}
