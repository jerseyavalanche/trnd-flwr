import { ApiRequestError, readResponseBody } from './http'
import type {
  IngestResponse,
  SignalsResponse,
  SourceHealthResponse,
  SourceRegistryResponse,
} from '../types/api'
import type { IngestResult, SignalItem, TrendInsight } from '../types/signals'
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

export const fetchSignals = async (): Promise<{
  signals: SignalItem[]
  status?: string
  message?: string
  error?: string
}> => {
  try {
    const payload = await fetchJson<unknown>('/api/signals')

    if (isSignalsEnvelope(payload)) {
      return {
        signals: payload.items,
        status: payload.status,
        message: payload.message,
        error: payload.status === 'storage_error' ? payload.message : undefined,
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
  notConfigured?: number
  error?: string
}> => {
  try {
    const payload = await fetchJson<unknown>('/api/sources/registry')

    if (isRegistryEnvelope(payload)) {
      return {
        sources: payload.sources,
        status: payload.status,
        message: payload.message,
        lastPullAt: payload.lastPullAt,
        healthy: payload.healthy,
        notConfigured: payload.notConfigured,
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

export const runIngestion = async (): Promise<IngestResult & { status?: string; message?: string }> => {
  try {
    const payload = await fetchJson<IngestResponse>('/api/ingest', {
      method: 'POST',
    })

    return payload
  } catch (error) {
    return {
      addedCount: 0,
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

export const createTrendInsight = async (signalIds: string[]): Promise<TrendInsight> =>
  fetchJson<TrendInsight>('/api/trend-insights', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ signalIds }),
  })
