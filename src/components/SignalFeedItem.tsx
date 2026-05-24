import { formatPublishedAge, formatRelativeTime } from '../lib/time'
import type { SignalItem } from '../types/signals'

type SignalFeedItemProps = {
  signal: SignalItem
}

export function SignalFeedItem({ signal }: SignalFeedItemProps) {
  const sourceTag = `[${signal.sourceLabel.replace('REDDIT:', 'REDDIT:')}]`

  return (
    <article className="group grid grid-cols-[64px_1fr] gap-3 border-b border-grid-border px-1 py-3 transition hover:bg-surface-2 sm:grid-cols-[80px_1fr]">
      {signal.imageUrl ? (
        <img
          alt=""
          className="h-16 w-16 border border-grid-border object-cover sm:h-20 sm:w-20"
          loading="lazy"
          src={signal.imageUrl}
        />
      ) : (
        <div className="h-16 w-16 border border-grid-border bg-surface sm:h-20 sm:w-20" />
      )}

      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-fg">
            <span className="text-cyan">{sourceTag}</span>{' '}
            <span>{signal.category}</span>{' '}
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
          {signal.domain} {formatPublishedAge(signal.publishedAt)}
        </p>
      </div>
    </article>
  )
}
