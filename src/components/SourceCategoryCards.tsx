import { sourceUniverse, type UniverseSourceCategory } from '../data/sourceUniverse'
import type { SignalItem } from '../types/signals'
import type { SourceStatus } from '../types/sources'

type SourceCategoryCardsProps = {
  signals: SignalItem[]
  sourceStatuses: SourceStatus[]
}

const categoryCards: { label: string; categories: UniverseSourceCategory[]; signalCategories: string[] }[] = [
  { label: 'Crypto / Wallet / On-Chain', categories: ['Crypto / Wallet / On-chain'], signalCategories: ['crypto'] },
  { label: 'Options Flow', categories: ['Options Flow / Unusual Activity'], signalCategories: ['options'] },
  {
    label: 'Live Market Data',
    categories: ['Live Market Data'],
    signalCategories: ['market', 'economic'],
  },
  {
    label: 'Institutional / Insider',
    categories: ['Institutional / Insider / Government'],
    signalCategories: ['institutional', 'insider'],
  },
  {
    label: 'News / Social',
    categories: ['News / Social / Attention', 'Technology / Public Feeds'],
    signalCategories: ['news', 'social', 'tech', 'ai', 'cultural'],
  },
  {
    label: 'Prediction Markets',
    categories: ['Prediction / Event Markets'],
    signalCategories: ['prediction'],
  },
  {
    label: 'Copy-Trader',
    categories: ['Copy-trader / Performance Platforms'],
    signalCategories: ['copytrader'],
  },
]

const matchesConfiguredSource = (matchTerms: string[], sourceStatuses: SourceStatus[]) =>
  sourceStatuses.some((status) => {
    const haystack = `${status.label} ${status.notes}`.toLowerCase()
    return matchTerms.some((term) => haystack.includes(term))
  })

export function SourceCategoryCards({ signals, sourceStatuses }: SourceCategoryCardsProps) {
  return (
    <section className="grid grid-cols-2 gap-2 border-b border-grid-border py-2 md:grid-cols-4 xl:grid-cols-7">
      {categoryCards.map((card) => {
        const universeSources = sourceUniverse.filter((source) => card.categories.includes(source.category))
        const connectedCount = universeSources.filter((source) => matchesConfiguredSource(source.matchTerms, sourceStatuses)).length
        const latestItemCount = signals.filter((signal) => card.signalCategories.includes(signal.category)).length
        const statusClass = connectedCount > 0 ? 'bg-signal-green' : latestItemCount > 0 ? 'bg-cyan' : 'bg-warn-amber'

        return (
          <div className="border border-grid-border bg-surface/50 p-2 font-mono" key={card.label}>
            <div className="flex items-center justify-between gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${statusClass}`} />
              <span className="text-[10px] uppercase tracking-[0.08em] text-muted-fg">{connectedCount} CONN</span>
            </div>
            <p className="mt-1 line-clamp-2 min-h-8 text-[11px] font-bold uppercase tracking-[0.08em] text-primary-fg">
              {card.label}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.08em] text-muted-fg">LATEST ITEMS:{latestItemCount}</p>
          </div>
        )
      })}
    </section>
  )
}
