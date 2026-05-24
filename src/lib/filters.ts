import { matchesUiCategory } from './categories'
import { matchesFeedSource } from './sourceFilters'
import type { CategoryFilter, GroupFilter, SignalItem, SortMode, SourceFilter, TrustTierFilter } from '../types/signals'

const importanceRank = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
} as const

export type SignalFilters = {
  search: string
  category: CategoryFilter
  source: SourceFilter
  trustTier: TrustTierFilter
  group: GroupFilter
  sortMode: SortMode
}

export const filterSignals = (signals: SignalItem[], filters: SignalFilters) => {
  const query = filters.search.trim().toLowerCase()

  return signals
    .filter((signal) => {
      const matchesSearch =
        query.length === 0 ||
        signal.title.toLowerCase().includes(query) ||
        signal.summary.toLowerCase().includes(query) ||
        signal.domain.toLowerCase().includes(query) ||
        signal.sourceLabel.toLowerCase().includes(query) ||
        signal.tags.some((tag) => tag.toLowerCase().includes(query))

      const matchesCategory = matchesUiCategory(signal, filters.category)
      const matchesSource = matchesFeedSource(signal, filters.source)
      const matchesTrust = filters.trustTier === 'all' || signal.trustTier === filters.trustTier
      const matchesGroup = filters.group === 'all' || signal.group === filters.group

      return matchesSearch && matchesCategory && matchesSource && matchesTrust && matchesGroup
    })
    .sort((a, b) => {
      if (filters.sortMode === 'confidence' || filters.sortMode === 'score') {
        return (b.confidence ?? b.score ?? 0) - (a.confidence ?? a.score ?? 0)
      }
      if (filters.sortMode === 'importance') {
        return (importanceRank[b.importance ?? 'low'] ?? 0) - (importanceRank[a.importance ?? 'low'] ?? 0)
      }
      if (filters.sortMode === 'repeated_symbol') return (b.seenCount ?? 1) - (a.seenCount ?? 1)
      if (filters.sortMode === 'active_source') return a.sourceLabel.localeCompare(b.sourceLabel)
      if (filters.sortMode === 'trust') return a.trustTier - b.trustTier || b.score - a.score
      if (filters.sortMode === 'published' || filters.sortMode === 'time') {
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      }
      return new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime()
    })
}

export const countBy = <T extends string>(items: SignalItem[], getKey: (item: SignalItem) => T) =>
  items.reduce<Record<T, number>>(
    (counts, item) => ({
      ...counts,
      [getKey(item)]: (counts[getKey(item)] ?? 0) + 1,
    }),
    {} as Record<T, number>,
  )
