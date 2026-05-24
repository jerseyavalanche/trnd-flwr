import { ApiRequestError, readResponseBody } from './http'
import type {
  IngestResponse,
  MarketQuotesResponse,
  SignalsResponse,
  SourceHealthResponse,
  SourceRegistryResponse,
} from '../types/api'
import type { IngestResult, SignalItem } from '../types/signals'
import type { SourceStatus } from '../types/sources'

const apiBase =
  import.meta.env.VITE_SIGNAL_INDEX_API_BASE ??
  (import.meta.env.DEV ? 'http://localhost:4000' : '')

const fetchJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const endpoint = `${apiBase}${path}`
  const response = await fetch(endpoint, init)
  const data = await readResponseBody(response, endpoint)
  return data as T
}

const isSignalFeed = (value: unknown): value is SignalItem[] =>
  Array.isArray(value) &&
  value.every((item) => typeof item === 'object' && item !== null && 'displayNumber' in item)

const isSignalsEnvelope = (value: unknown): value is SignalsResponse =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as SignalsResponse).items)

const isRegistryEnvelope = (value: unknown): value is SourceRegistryResponse =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as SourceRegistryResponse).sources)

const toErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof ApiRequestError) return error.message
  if (error instanceof Error) return error.message
  return fallback
}

export const fetchSignals = async (params: { limit?: number; offset?: number; q?: string; category?: string; source?: string; signalType?: string; sort?: string } = {}): Promise<{
  signals: SignalItem[]
  status?: string
  message?: string
  error?: string
  total?: number
  offset?: number
  limit?: number
  hasMore?: boolean
}> => {
  try {
    const query = new URLSearchParams()
    if (params.limit !== undefined) query.set('limit', String(params.limit))
    if (params.offset !== undefined) query.set('offset', String(params.offset))
    if (params.q) query.set('q', params.q)
    if (params.category) query.set('category', params.category)
    if (params.source) query.set('source', params.source)
    if (params.signalType) query.set('signalType', params.signalType)
    if (params.sort) query.set('sort', params.sort)
    const payload = await fetchJson<unknown>(`/api/signals${query.size > 0 ? `?${query.toString()}` : ''}`)

    if (isSignalsEnvelope(payload)) {
      return {
        signals: payload.items,
        status: payload.status,
        message: payload.message,
        error: payload.status === 'storage_error' ? payload.message : undefined,
        total: payload.total,
        offset: payload.offset,
        limit: payload.limit,
        hasMore: payload.hasMore,
      }
    }

    if (isSignalFeed(payload)) {
      return { signals: payload }
    }

    throw new Error('Unexpected signal payload')
  } catch (error) {
    return {
      signals: [],
      error: toErrorMessage(error, 'Unable to load persisted signals'),
    }
  }
}

export const fetchSourceRegistry = async (): Promise<{
  sources: SourceStatus[]
  status?: string
  message?: string
  lastPullAt?: string | null
  healthy?: number
  failed?: number
  notConfigured?: number
  configured?: number
  enabled?: number
  lastError?: string | null
  credentialsMode?: SourceRegistryResponse['credentialsMode']
  credentialsMessage?: string
  error?: string
}> => {
  try {
    const payload = await fetchJson<unknown>('/api/sources/health')

    if (isRegistryEnvelope(payload)) {
      return {
        sources: payload.sources,
        status: payload.status,
        message: payload.message,
        lastPullAt: payload.lastPullAt,
        healthy: payload.healthy,
        failed: payload.failed,
        notConfigured: payload.notConfigured,
        configured: payload.configured,
        enabled: payload.enabled,
        lastError: payload.lastError,
        credentialsMode: payload.credentialsMode,
        credentialsMessage: payload.credentialsMessage,
      }
    }

    if (Array.isArray(payload)) {
      return { sources: payload as SourceStatus[] }
    }

    throw new Error('Unexpected registry payload')
  } catch (error) {
    return {
      sources: [],
      error: toErrorMessage(error, 'Unable to load source registry'),
    }
  }
}

export const fetchSourceStatus = async (): Promise<{
  sources: SourceStatus[]
  status?: string
  message?: string
  error?: string
}> => {
  try {
    const payload = await fetchJson<unknown>('/api/sources/status')

    if (isRegistryEnvelope(payload)) {
      return {
        sources: payload.sources,
        status: payload.status,
        message: payload.message,
      }
    }

    if (Array.isArray(payload)) {
      return { sources: payload as SourceStatus[] }
    }

    throw new Error('Unexpected source status payload')
  } catch (error) {
    return {
      sources: [],
      error: toErrorMessage(error, 'Unable to load source status'),
    }
  }
}

export const fetchSourceHealth = async () => {
  try {
    return await fetchJson<SourceHealthResponse>('/api/source-health')
  } catch (error) {
    return {
      sources: [],
      items: [],
      status: 'error' as const,
      message: toErrorMessage(error, 'Unable to load source health'),
      healthy: 0,
      notConfigured: 0,
    }
  }
}

export const fetchMarketQuotes = async (): Promise<MarketQuotesResponse> => {
  try {
    return await fetchJson<MarketQuotesResponse>('/api/market/quotes')
  } catch (error) {
    return {
      status: 'error',
      message: toErrorMessage(error, 'Market ticker unavailable'),
      quotes: [],
      errors: [{ source: 'api', message: toErrorMessage(error, 'Market ticker unavailable') }],
      pulledAt: new Date().toISOString(),
    }
  }
}

export const runIngestion = async (): Promise<
  IngestResult & {
    status?: string
    message?: string
    sourcesAttempted?: number
    sourcesSucceeded?: number
    sourcesFailed?: number
    itemsFetched?: number
    itemsInserted?: number
    itemsUpdated?: number
  }
> => {
  try {
    const payload = await fetchJson<IngestResponse>('/api/ingest/run', {
      method: 'POST',
    })

    return {
      ...payload,
      addedCount: payload.addedCount ?? payload.itemsInserted ?? 0,
      updatedCount: payload.updatedCount ?? payload.itemsUpdated ?? 0,
      skippedDuplicateCount: payload.skippedDuplicateCount ?? 0,
      records: payload.records ?? [],
      errors: payload.errors ?? [],
    }
  } catch (error) {
    return {
      addedCount: 0,
      updatedCount: 0,
      skippedDuplicateCount: 0,
      records: [],
      status: 'error',
      message: toErrorMessage(error, 'Ingestion request failed'),
      errors: [
        {
          source: 'api',
          message: toErrorMessage(error, 'Ingestion request failed'),
        },
      ],
    }
  }
}

