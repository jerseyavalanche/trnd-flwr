import type { GroupFilter } from '../types/signals'
import { sourceGroups } from '../types/sources'

type GroupFilterBarProps = {
  selected: GroupFilter
  onChange: (value: GroupFilter) => void
}

export function GroupFilterBar({ selected, onChange }: GroupFilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      <button
        className={`shrink-0 rounded border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition ${
          selected === 'all' ? 'border-signal-green/50 bg-signal-green/10 text-signal-green' : 'border-grid-border text-muted-fg hover:bg-surface-2'
        }`}
        onClick={() => onChange('all')}
        type="button"
      >
        ALL GROUPS
      </button>
      {sourceGroups.map((group) => (
        <button
          className={`shrink-0 rounded border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition ${
            selected === group ? 'border-signal-green/50 bg-signal-green/10 text-signal-green' : 'border-grid-border text-muted-fg hover:bg-surface-2'
          }`}
          key={group}
          onClick={() => onChange(group)}
          type="button"
        >
          {group.replaceAll('_', ' ')}
        </button>
      ))}
    </div>
  )
}
