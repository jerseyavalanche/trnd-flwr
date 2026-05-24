import type { SignalItem } from '../types/signals'

export const buildFeedSourceFilters = (signals: SignalItem[]) => {
  const sources = Array.from(
    new Map(signals.map((signal) => [signal.sourceId, signal.sourceLabel])).entries(),
  ).sort(([, a], [, b]) => a.localeCompare(b))

  return [{ id: 'all', label: 'SRC:ALL' }, ...sources.map(([id, label]) => ({ id, label }))]
}

export const countSignalsForSource = (signals: SignalItem[], sourceId: string) => {
  if (sourceId === 'all') return signals.length
  return signals.filter((signal) => signal.sourceId === sourceId).length
}

export const matchesFeedSource = (signal: SignalItem, sourceId: string) => {
  if (sourceId === 'all') return true
  return signal.sourceId === sourceId
}
