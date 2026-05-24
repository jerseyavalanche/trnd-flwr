import { useCallback, useEffect, useState } from 'react'
import { fetchMarketQuotes } from '../lib/api'
import type { MarketQuote } from '../types/api'

const formatPrice = (quote: MarketQuote) =>
  quote.price >= 1000
    ? quote.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
    : quote.price.toLocaleString('en-US', { maximumFractionDigits: quote.price < 10 ? 2 : 2 })

const formatChange = (changePercent: number | null) => {
  if (changePercent === null) return '--'
  const prefix = changePercent > 0 ? '+' : ''
  return `${prefix}${changePercent.toFixed(2)}%`
}

export function MarketFeedStrip() {
  const [quotes, setQuotes] = useState<MarketQuote[]>([])
  const [status, setStatus] = useState<'loading' | 'ok' | 'partial' | 'error'>('loading')
  const [message, setMessage] = useState('Loading real market quotes.')

  const loadQuotes = useCallback(async () => {
    const result = await fetchMarketQuotes()
    setQuotes(result.quotes)
    setStatus(result.status)
    setMessage(result.message)
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadQuotes)
    const timer = setInterval(() => void loadQuotes(), 60_000)
    return () => clearInterval(timer)
  }, [loadQuotes])

  const statusText =
    status === 'loading'
      ? 'Market Data Loading'
      : status === 'error'
        ? 'Market Data Unavailable'
        : status === 'partial'
          ? 'Market Data Partial'
          : 'Market Data Live'

  const statusClass = status === 'ok' ? 'text-cyan' : status === 'partial' ? 'text-warn-amber' : 'text-muted-fg'
  const dotClass = status === 'ok' ? 'bg-cyan shadow-[0_0_8px_rgba(34,211,238,0.7)]' : 'bg-warn-amber shadow-[0_0_8px_rgba(251,191,36,0.7)]'
  const tapeQuotes = quotes.length > 0 ? [...quotes, ...quotes, ...quotes] : []

  return (
    <div className="border-b border-grid-border bg-app-bg">
      <div className="mx-auto grid max-w-[1240px] grid-cols-[auto_1fr] items-center gap-3 px-4 py-1">
        <div className="ticker z-10 flex shrink-0 items-center gap-2 bg-app-bg pr-2 font-mono text-[10px] uppercase tracking-[0.1em]">
          <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          <span className={statusClass}>{statusText}</span>
        </div>
        <div className="ticker-marquee-mask overflow-hidden">
          {tapeQuotes.length > 0 ? (
            <div className="ticker-marquee flex w-max items-center gap-4">
              {tapeQuotes.map((quote, index) => (
                <span
                  className="ticker shrink-0 border-l border-grid-border pl-3 font-mono text-[10px] uppercase tracking-[0.1em]"
                  key={`${quote.source}:${quote.symbol}:${index}`}
                  title={`${quote.source.toUpperCase()} ${quote.sourceSymbol}${quote.asOf ? ` ${quote.asOf}` : ''}`}
                >
                  <span className="text-primary-fg">{quote.symbol}</span>{' '}
                  <span className="text-primary-fg">{formatPrice(quote)}</span>{' '}
                  <span className={quote.changePercent !== null && quote.changePercent < 0 ? 'text-red-300' : 'text-cyan'}>
                    {formatChange(quote.changePercent)}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <span className="ticker block truncate font-mono text-[10px] uppercase tracking-[0.1em] text-muted-fg">
              {message || 'No real quotes returned.'}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
