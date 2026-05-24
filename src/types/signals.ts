import type { SourceCategory, SourceGroup, TrustTier } from './sources'

export type UiCategory = 'all' | 'cultural' | 'social' | 'economic' | 'market' | 'tech' | 'news' | 'prediction'

export type SignalItem = {
  id: string
  displayNumber: number
  sourceId: string
  sourceLabel: string
  category: SourceCategory
  group: SourceGroup
  trustTier: TrustTier
  score: number
  title: string
  url: string
  summary: string
  imageUrl?: string
  domain: string
  author?: string
  publishedAt: string
  ingestedAt: string
  tags: string[]
  rawType: string
  isPrediction: boolean
  isOfficial: boolean
  isSocial: boolean
  isSecurity: boolean
  isMarketMoving: boolean
  symbol?: string | null
  assetClass?: string | null
  direction?: string | null
  confidence?: number | null
  sourceUrl?: string | null
  dedupeKey?: string
  rawPayloadRef?: string | null
  rawPayloadSummary?: string | null
}

export type IngestError = {
  source: string
  message: string
}

export type IngestResult = {
  addedCount: number
  skippedDuplicateCount: number
  records: SignalItem[]
  errors: IngestError[]
}

export type TrendInsight = {
  id: string
  signalIds: string[]
  generatedText: string
  createdAt: string
  sourceCount: number
  symbols: string[]
  userAction: 'copyable_trend_insight'
}

export type SortMode = 'time' | 'score' | 'trust'

export type CategoryFilter = UiCategory
export type SourceFilter = 'all' | string
export type TrustTierFilter = 'all' | TrustTier
export type GroupFilter = 'all' | SourceGroup
