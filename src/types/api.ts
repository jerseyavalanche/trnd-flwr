import type { IngestResult, SignalItem } from './signals'
import type { SourceStatus } from './sources'

export type ApiStatus = 'ok' | 'partial' | 'empty' | 'not_configured' | 'storage_error' | 'error'

export type SignalsResponse = {
  items: SignalItem[]
  status: ApiStatus
  message: string
  total?: number
  offset?: number
  limit?: number
  hasMore?: boolean
}

export type SourceRegistryResponse = {
  sources: SourceStatus[]
  items: SourceStatus[]
  status: ApiStatus
  message: string
  lastPullAt: string | null
  healthy: number
  failed: number
  notConfigured: number
  configured: number
  enabled: number
  lastError: string | null
  credentialsMode: 'firestore_connected' | 'firestore_degraded' | 'source_only'
  credentialsMessage: string
}

export type SourceHealthResponse = {
  sources: SourceStatus[]
  items: SourceStatus[]
  status: ApiStatus
  message: string
  healthy: number
  notConfigured: number
}

export type MarketQuote = {
  symbol: string
  price: number
  changePercent: number | null
  source: 'stooq' | 'coingecko'
  sourceSymbol: string
  asOf: string | null
}

export type MarketQuotesResponse = {
  status: 'ok' | 'partial' | 'error'
  message: string
  quotes: MarketQuote[]
  errors: { source: string; message: string }[]
  pulledAt: string
}

export type IngestResponse = IngestResult & {
  runId?: string
  status: ApiStatus
  message: string
  sourcesAttempted?: number
  sourcesSucceeded?: number
  sourcesFailed?: number
  itemsFetched?: number
  itemsInserted?: number
  itemsUpdated?: number
  errorsBySource?: Record<string, string>
}
