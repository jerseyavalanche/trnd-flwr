import type { SignalItem } from '../../types/signals'
import type { RawSignal } from '../../types/trends'

/** Maps persisted feed signals into the PIRATE_DOCK RawSignal shape. */
export function signalToRawSignal(signal: SignalItem): RawSignal {
  const tickers = signal.symbol ? [signal.symbol.toUpperCase()] : []
  const sectors = [signal.assetClass, signal.category].filter(
    (value): value is string => Boolean(value),
  )

  return {
    id: signal.id,
    source: signal.sourceLabel,
    category: signal.category,
    title: signal.title,
    description: signal.summary,
    url: signal.url,
    score: signal.score,
    created_at: signal.ingestedAt,
    published_at: signal.publishedAt,
    tickers: tickers.length > 0 ? tickers : undefined,
    sectors: sectors.length > 0 ? sectors : undefined,
  }
}

export function signalsToRawSignals(signals: SignalItem[]): RawSignal[] {
  return signals.map(signalToRawSignal)
}
