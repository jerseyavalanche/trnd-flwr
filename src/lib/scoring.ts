import type { SignalItem } from '../types/signals'
import type { SourceStatus } from '../types/sources'

export const summarizeSources = (sources: SourceStatus[]) => ({
  live: sources.filter((source) => source.status === 'live').length,
  degraded: sources.filter((source) => source.status === 'degraded').length,
  offline: sources.filter((source) => source.status === 'offline').length,
  auth_needed: sources.filter((source) => source.status === 'auth_needed').length,
  limited: sources.filter((source) => source.status === 'limited').length,
  planned: sources.filter((source) => source.status === 'planned').length,
})

export const countSignalsByCategory = (signals: SignalItem[]) =>
  signals.reduce<Record<string, number>>((counts, signal) => {
    counts[signal.category] = (counts[signal.category] ?? 0) + 1
    return counts
  }, {})
