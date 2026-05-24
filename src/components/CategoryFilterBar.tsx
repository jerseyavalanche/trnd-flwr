import { uiCategories, uiCategoryLabels } from '../lib/categories'
import type { CategoryFilter } from '../types/signals'

type CategoryFilterBarProps = {
  selected: CategoryFilter
  onChange: (value: CategoryFilter) => void
}

export function CategoryFilterBar({ selected, onChange }: CategoryFilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2 py-2">
      {uiCategories.map((category) => {
        const label = category === 'all' ? 'ALL' : uiCategoryLabels[category]
        const active = selected === category

        return (
          <button
            className={`border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.1em] ${
              active ? 'border-cyan text-cyan' : 'border-grid-border text-muted-fg hover:text-primary-fg'
            }`}
            key={category}
            onClick={() => onChange(category)}
            type="button"
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
