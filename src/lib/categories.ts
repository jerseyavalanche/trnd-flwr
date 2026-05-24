import type { SignalItem, UiCategory } from '../types/signals'
import type { SourceCategory } from '../types/sources'

export const uiCategoryLabels: Record<Exclude<UiCategory, 'all'>, string> = {
  cultural: 'CULTURAL',
  social: 'SOCIAL',
  economic: 'ECONOMIC',
  market: 'MARKET',
  options: 'OPTIONS FLOW',
  institutional: 'INSTITUTIONAL',
  insider: 'INSIDER',
  tech: 'TECHNOLOGY',
  news: 'NEWS',
  prediction: 'PREDICTION',
  crypto: 'CRYPTO',
  copytrader: 'COPY-TRADER',
  other: 'OTHER',
}

export const uiCategories: UiCategory[] = [
  'all',
  'cultural',
  'social',
  'economic',
  'crypto',
  'options',
  'market',
  'institutional',
  'insider',
  'tech',
  'news',
  'prediction',
  'copytrader',
  'other',
]

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
    CRYPTO: 0,
    OPTIONS: 0,
    INSTITUTIONAL: 0,
    INSIDER: 0,
    COPYTRADER: 0,
    OTHER: 0,
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
  if (category === 'crypto') return 'CRYPTO'
  if (category === 'options') return 'OPTIONS'
  if (category === 'institutional') return 'INSTITUTIONAL'
  if (category === 'insider') return 'INSIDER'
  if (category === 'copytrader') return 'COPYTRADER'
  if (category === 'other') return 'OTHER'
  return null
}
