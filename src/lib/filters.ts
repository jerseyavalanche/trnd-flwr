import { matchesUiCategory } from './categories'
import { matchesFeedSource } from './sourceFilters'
import type { CategoryFilter, GroupFilter, SignalItem, SortMode, SourceFilter, TrustTierFilter } from '../types/signals'

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
        signal.tags.some((tag) => tag.toLowerCase().includes(query))

      const matchesCategory = matchesUiCategory(signal, filters.category)
      const matchesSource = matchesFeedSource(signal, filters.source)
      const matchesTrust = filters.trustTier === 'all' || signal.trustTier === filters.trustTier
      const matchesGroup = filters.group === 'all' || signal.group === filters.group

      return matchesSearch && matchesCategory && matchesSource && matchesTrust && matchesGroup
    })
    .sort((a, b) => {
      if (filters.sortMode === 'score') return b.score - a.score
      if (filters.sortMode === 'trust') return a.trustTier - b.trustTier || b.score - a.score
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
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
