import { sourceUniverse, type UniverseSource, type UniverseSourceStatus } from '../data/sourceUniverse'
import { formatRelativeTime } from '../lib/time'
import type { SignalItem } from '../types/signals'
import type { SourceStatus } from '../types/sources'

type SourceMatrixPanelProps = {
  configuredCount: number
  ingesting: boolean
  onPullSources: () => void
  signals: SignalItem[]
  sourceStatuses: SourceStatus[]
}

type ResolvedSource = UniverseSource & {
  resolvedStatus: UniverseSourceStatus
  latestItemCount: number
  lastAttemptAt?: string
  lastSuccessAt?: string
  lastError?: string
}

const statusLabels: Record<UniverseSourceStatus, string> = {
  connected: 'CONNECTED',
  needs_api_key: 'NEEDS API KEY',
  needs_oauth: 'NEEDS OAUTH',
  public_feed_possible: 'PUBLIC FEED AVAILABLE',
  scrape_possible: 'SCRAPE POSSIBLE',
  paid_vendor_access_needed: 'PAID/VENDOR ACCESS NEEDED',
  rate_limited: 'RATE LIMITED',
  error: 'ERROR',
  unavailable: 'UNAVAILABLE',
  disabled: 'DISABLED',
}

const statusClasses: Record<UniverseSourceStatus, string> = {
  connected: 'border-signal-green/40 bg-signal-green/10 text-signal-green',
  needs_api_key: 'border-warn-amber/40 bg-warn-amber/10 text-warn-amber',
  needs_oauth: 'border-warn-amber/40 bg-warn-amber/10 text-warn-amber',
  public_feed_possible: 'border-cyan/40 bg-cyan/10 text-cyan',
  scrape_possible: 'border-cyan/40 bg-cyan/10 text-cyan',
  paid_vendor_access_needed: 'border-gold/40 bg-gold/10 text-gold',
  rate_limited: 'border-warn-amber/40 bg-warn-amber/10 text-warn-amber',
  error: 'border-offline-red/40 bg-offline-red/10 text-offline-red',
  unavailable: 'border-offline-red/40 bg-offline-red/10 text-offline-red',
  disabled: 'border-grid-border bg-surface text-muted-fg',
}

const normalize = (value: string) => value.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '')

const sourceMatches = (source: UniverseSource, value: string) => {
  const normalized = normalize(value)
  return source.matchTerms.some((term) => normalized.includes(normalize(term)) || normalize(term).includes(normalized))
}

const resolveSource = (source: UniverseSource, sourceStatuses: SourceStatus[], signals: SignalItem[]): ResolvedSource => {
  const matchingStatus = sourceStatuses.find((status) => sourceMatches(source, status.label) || sourceMatches(source, status.notes))
  const matchingSignals = signals.filter(
    (signal) =>
      sourceMatches(source, signal.sourceLabel) ||
      sourceMatches(source, signal.domain) ||
      sourceMatches(source, signal.url),
  )
  const connected = matchingStatus?.status === 'live' || matchingSignals.length > 0

  return {
    ...source,
    resolvedStatus: connected ? 'connected' : source.status,
    latestItemCount: matchingSignals.length || matchingStatus?.count24h || 0,
    lastAttemptAt: matchingStatus?.lastAttemptAt ?? matchingStatus?.lastErrorAt,
    lastSuccessAt: matchingStatus?.lastSuccessAt,
    lastError: matchingStatus?.lastError,
  }
}

export function SourceMatrixPanel({
  configuredCount,
  ingesting,
  onPullSources,
  signals,
  sourceStatuses,
}: SourceMatrixPanelProps) {
  const resolvedSources = sourceUniverse.map((source) => resolveSource(source, sourceStatuses, signals))
  const connectedCount = resolvedSources.filter((source) => source.resolvedStatus === 'connected').length
  const publicCount = resolvedSources.filter((source) => source.resolvedStatus === 'public_feed_possible').length
  const credentialCount = resolvedSources.filter((source) => source.resolvedStatus === 'needs_api_key').length
  const vendorCount = resolvedSources.filter((source) => source.resolvedStatus === 'paid_vendor_access_needed').length
  const unavailableCount = resolvedSources.filter((source) => source.resolvedStatus === 'unavailable').length

  return (
    <section className="my-3 pb-24 font-mono">
      <div className="mb-2 border border-grid-border bg-surface/60 p-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-fg">Source Matrix / Ingestion Control</p>
            <p className="mt-1 max-w-3xl text-[11px] leading-4 text-muted-fg">
              Broad ingestion universe. Sources are not marked connected unless configured health or real pulled items prove it.
            </p>
          </div>
          <button
            className="border border-grid-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-fg transition hover:border-cyan hover:text-cyan disabled:opacity-50"
            disabled={configuredCount === 0 || ingesting}
            onClick={onPullSources}
            type="button"
          >
            {ingesting ? 'INGESTING...' : 'Ingest New Signals'}
          </button>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] uppercase tracking-[0.08em] text-muted-fg sm:grid-cols-5">
          <span className="border border-grid-border bg-app-bg px-2 py-1">CONNECTED:{connectedCount}</span>
          <span className="border border-grid-border bg-app-bg px-2 py-1">PUBLIC:{publicCount}</span>
          <span className="border border-grid-border bg-app-bg px-2 py-1">KEYS:{credentialCount}</span>
          <span className="border border-grid-border bg-app-bg px-2 py-1">VENDOR:{vendorCount}</span>
          <span className="border border-grid-border bg-app-bg px-2 py-1">UNAVAILABLE:{unavailableCount}</span>
        </div>
      </div>

      <div className="grid gap-2 lg:grid-cols-2">
        {resolvedSources.map((source) => {
          const canPull = source.resolvedStatus === 'connected'
          const needsApiKey = source.resolvedStatus === 'needs_api_key'
          const paidRequired = source.resolvedStatus === 'paid_vendor_access_needed'
          const connectionMethod = source.resolvedStatus === 'connected' ? 'configured adapter' : source.resolvedStatus.replaceAll('_', ' ')
          const disabledReason =
            source.resolvedStatus === 'needs_api_key'
              ? 'Credentials required.'
              : source.resolvedStatus === 'needs_oauth'
                ? 'OAuth authorization required.'
              : source.resolvedStatus === 'paid_vendor_access_needed'
                ? 'Vendor access required.'
                : source.resolvedStatus === 'public_feed_possible'
                  ? 'Add this feed/API to env before ingest.'
                  : source.resolvedStatus === 'scrape_possible'
                    ? 'Public scrape may be possible if allowed and implemented.'
                    : source.resolvedStatus === 'rate_limited'
                      ? 'Source is rate limited.'
                      : source.resolvedStatus === 'error'
                        ? 'Source returned an error.'
                        : source.resolvedStatus === 'unavailable'
                          ? 'No approved connector configured.'
                          : source.resolvedStatus === 'disabled'
                            ? 'Disabled by policy until allowed endpoints are confirmed.'
                            : undefined

          return (
            <article className="border border-grid-border bg-[#060c0e] p-2" key={source.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <a
                    className="block truncate text-xs font-bold uppercase tracking-[0.08em] text-primary-fg hover:text-cyan"
                    href={source.url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {source.name}
                  </a>
                  <p className="mt-1 truncate text-[10px] uppercase tracking-[0.08em] text-muted-fg">{source.category}</p>
                </div>
                <span className={`shrink-0 border px-1.5 py-0.5 text-[9px] font-bold uppercase ${statusClasses[source.resolvedStatus]}`}>
                  {statusLabels[source.resolvedStatus]}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1">
                {source.modes.map((mode) => (
                  <span className="border border-grid-border bg-app-bg px-1.5 py-0.5 text-[9px] uppercase text-muted-fg" key={mode}>
                    {mode}
                  </span>
                ))}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] uppercase tracking-[0.08em] text-muted-fg">
                <span className="border border-grid-border bg-app-bg px-2 py-1">LATEST:{source.latestItemCount}</span>
                <span className="border border-grid-border bg-app-bg px-2 py-1">TOTAL:{source.latestItemCount}</span>
                <span className="border border-grid-border bg-app-bg px-2 py-1">
                  ATTEMPT:{source.lastAttemptAt ? formatRelativeTime(source.lastAttemptAt) : 'NEVER'}
                </span>
                <span className="border border-grid-border bg-app-bg px-2 py-1">
                  SUCCESS:{source.lastSuccessAt ? formatRelativeTime(source.lastSuccessAt) : 'NEVER'}
                </span>
                <span className="border border-grid-border bg-app-bg px-2 py-1">KEY:{needsApiKey ? 'YES' : 'NO'}</span>
                <span className="border border-grid-border bg-app-bg px-2 py-1">PAID:{paidRequired ? 'YES' : 'NO'}</span>
              </div>

              <p className="mt-2 truncate text-[10px] uppercase tracking-[0.08em] text-muted-fg">METHOD:{connectionMethod}</p>

              <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-muted-fg">{source.lastError ?? source.notes}</p>

              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  className="border border-grid-border px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-muted-fg transition hover:border-cyan hover:text-cyan"
                  href={source.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Source
                </a>
                {source.docsUrl && (
                  <a
                    className="border border-grid-border px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-muted-fg transition hover:border-cyan hover:text-cyan"
                    href={source.docsUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    API / Docs
                  </a>
                )}
                <button
                  className="border border-grid-border px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-primary-fg transition hover:border-cyan hover:text-cyan disabled:text-muted-fg disabled:opacity-50"
                  disabled={!canPull || ingesting}
                  onClick={onPullSources}
                  title={disabledReason}
                  type="button"
                >
                  {canPull ? 'Ingest' : 'Blocked'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
