import type { IngestResult, SignalItem } from './signals'
import type { SourceStatus } from './sources'

export type ApiStatus = 'ok' | 'empty' | 'not_configured' | 'storage_error' | 'error'

export type SignalsResponse = {
  items: SignalItem[]
  status: ApiStatus
  message: string
}

export type SourceRegistryResponse = {
  sources: SourceStatus[]
  items: SourceStatus[]
  status: ApiStatus
  message: string
  lastPullAt: string | null
  healthy: number
  notConfigured: number
}

export type SourceHealthResponse = {
  sources: SourceStatus[]
  items: SourceStatus[]
  status: ApiStatus
  message: string
  healthy: number
  notConfigured: number
}

export type IngestResponse = IngestResult & {
  status: ApiStatus
  message: string
}
