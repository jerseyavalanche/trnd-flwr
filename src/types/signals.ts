import type { SourceCategory, SourceGroup, TrustTier } from './sources'

export type UiCategory =
  | 'all'
  | 'cultural'
  | 'social'
  | 'economic'
  | 'market'
  | 'options'
  | 'institutional'
  | 'insider'
  | 'tech'
  | 'news'
  | 'prediction'
  | 'crypto'
  | 'copytrader'
  | 'other'

export type SignalType =
  | 'news'
  | 'whale_move'
  | 'options_flow'
  | 'insider_trade'
  | 'institutional_filing'
  | 'social_attention'
  | 'prediction_market'
  | 'price_move'
  | 'dex_activity'
  | 'trader_profile'

export type SignalImportance = 'low' | 'medium' | 'high' | 'urgent'

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
  signalType?: SignalType | null
  importance?: SignalImportance | null
  lastSeenAt?: string | null
  seenCount?: number | null
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
  updatedCount?: number
  skippedDuplicateCount: number
  records: SignalItem[]
  errors: IngestError[]
}

export type SortMode = 'ingested' | 'published' | 'importance' | 'confidence' | 'repeated_symbol' | 'active_source' | 'time' | 'score' | 'trust'

export type CategoryFilter = UiCategory
export type SourceFilter = 'all' | string
export type TrustTierFilter = 'all' | TrustTier
export type GroupFilter = 'all' | SourceGroup
