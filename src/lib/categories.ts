import type { SignalItem, UiCategory } from '../types/signals'
import type { SourceCategory } from '../types/sources'

export const uiCategoryLabels: Record<Exclude<UiCategory, 'all'>, string> = {
  cultural: 'CULTURAL',
  social: 'SOCIAL',
  economic: 'ECONOMIC',
  market: 'MARKET',
  tech: 'TECHNOLOGY',
  news: 'NEWS',
  prediction: 'PREDICTION',
}

export const uiCategories: UiCategory[] = ['all', 'cultural', 'social', 'economic', 'market', 'tech', 'news', 'prediction']

export const matchesUiCategory = (signal: SignalItem, category: UiCategory) => {
  if (category === 'all') return true
  if (category === 'tech') return signal.category === 'tech' || signal.category === 'ai'
  return signal.category === category
}

export const countUiCategories = (signals: SignalItem[]) => {
  const counts: Record<string, number> = {
    TECHNOLOGY: 0,
    NEWS: 0,
    PREDICTION: 0,
    CULTURAL: 0,
    SOCIAL: 0,
    ECONOMIC: 0,
    MARKET: 0,
  }

  for (const signal of signals) {
    const key = categoryToCountLabel(signal.category)
    if (key) counts[key] += 1
  }

  return counts
}

const categoryToCountLabel = (category: SourceCategory): string | null => {
  if (category === 'tech' || category === 'ai') return 'TECHNOLOGY'
  if (category === 'news') return 'NEWS'
  if (category === 'prediction') return 'PREDICTION'
  if (category === 'cultural') return 'CULTURAL'
  if (category === 'social') return 'SOCIAL'
  if (category === 'economic') return 'ECONOMIC'
  if (category === 'market') return 'MARKET'
  return null
}
