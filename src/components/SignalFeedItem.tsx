import { formatPublishedAge, formatRelativeTime } from '../lib/time'
import type { SignalItem } from '../types/signals'

type SignalFeedItemProps = {
  signal: SignalItem
}

export function SignalFeedItem({ signal }: SignalFeedItemProps) {
  const sourceTag = `[${signal.sourceLabel.replace('REDDIT:', 'REDDIT:')}]`
  const published = signal.publishedAt || 'unknown'
  const insight = [
    'TRND_FLWR SIGNAL',
    `Title: ${signal.title}`,
    `Source: ${signal.domain || signal.sourceLabel}`,
    `URL: ${signal.url}`,
    `Published: ${published || 'unknown'}`,
    `Signal Type: ${signal.signalType ?? 'news'}`,
    `Direction: ${signal.direction ?? 'unknown'}`,
    `Confidence: ${signal.confidence ?? 'unknown'}`,
    `Summary: ${signal.summary || signal.rawPayloadSummary || 'No summary provided by source.'}`,
  ].join('\n')

  const copyText = (value: string) => {
    void navigator.clipboard.writeText(value)
  }

  return (
    <article className="group grid grid-cols-[72px_1fr] gap-3 border-b border-grid-border px-1 py-3 transition hover:bg-surface-2 sm:grid-cols-[96px_1fr]">
      {signal.imageUrl ? (
        <img
          alt=""
          className="h-18 w-18 border border-grid-border object-cover sm:h-24 sm:w-24"
          loading="lazy"
          src={signal.imageUrl}
        />
      ) : (
        <div className="flex h-18 w-18 items-center justify-center border border-grid-border bg-surface p-1 sm:h-24 sm:w-24">
          <span className="line-clamp-2 text-center font-mono text-[9px] uppercase tracking-[0.08em] text-muted-fg">
            {signal.domain || signal.sourceLabel}
          </span>
        </div>
      )}

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1 font-mono text-[10px] uppercase tracking-[0.06em] text-muted-fg">
            <span className="truncate text-cyan">{sourceTag}</span>
            <span className="border border-grid-border px-1 text-muted-fg">{signal.category}</span>
            {signal.signalType && <span className="border border-grid-border px-1 text-muted-fg">{signal.signalType}</span>}
            {signal.symbol && <span className="border border-grid-border px-1 text-cyan">{signal.symbol}</span>}
            <span className="text-muted-fg">#{signal.displayNumber}</span>
          </div>
          <span className="shrink-0 font-mono text-[10px] text-muted-fg">{formatRelativeTime(signal.ingestedAt)}</span>
        </div>

        <a
          className="mt-1.5 block text-[14px] font-semibold leading-snug text-primary-fg group-hover:text-cyan"
          href={signal.url}
          rel="noreferrer"
          target="_blank"
        >
          {signal.title}
        </a>

        <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-muted-fg">{signal.summary}</p>

        <p className="mt-1.5 font-mono text-[10px] text-muted-fg">
          {signal.domain} {formatPublishedAge(signal.publishedAt)} ING:{formatRelativeTime(signal.ingestedAt)}
          {signal.assetClass ? ` ASSET:${signal.assetClass}` : ''} {signal.direction ? ` DIR:${signal.direction}` : ''}
          {signal.confidence !== null && signal.confidence !== undefined ? ` CONF:${signal.confidence}` : ''}
          {signal.seenCount && signal.seenCount > 1 ? ` SEEN:${signal.seenCount}` : ''}
        </p>

        <div className="mt-2 flex flex-wrap gap-2">
          <a
            className="border border-grid-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-primary-fg transition hover:border-cyan hover:text-cyan"
            href={signal.url}
            rel="noreferrer"
            target="_blank"
          >
            Open Source
          </a>
          <button
            className="border border-grid-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-fg transition hover:border-cyan hover:text-cyan"
            onClick={() => copyText(insight)}
            type="button"
          >
            Copy Insight
          </button>
          <button
            className="border border-grid-border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-fg transition hover:border-cyan hover:text-cyan"
            onClick={() => copyText(signal.url)}
            type="button"
          >
            Copy URL
          </button>
        </div>
      </div>
    </article>
  )
}
