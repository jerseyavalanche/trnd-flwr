import { formatRelativeTime } from '../lib/time'
import type { SourceStatus } from '../types/sources'

type SourceHealthCardProps = {
  configured: number
  enabled: number
  healthy: number
  failed: number
  lastPullAt: string | null
  lastError?: string | null
  credentialsMode?: 'firestore_connected' | 'firestore_degraded' | 'source_only'
  credentialsMessage?: string
  sources: SourceStatus[]
}

const modeLabel = (mode: SourceHealthCardProps['credentialsMode']) => {
  if (mode === 'firestore_connected') return 'Firestore connected'
  if (mode === 'firestore_degraded') return 'Firestore degraded'
  return 'Local/source-only mode'
}

export function SourceHealthCard({
  configured,
  enabled,
  healthy,
  failed,
  lastPullAt,
  lastError,
  credentialsMode,
  credentialsMessage,
  sources,
}: SourceHealthCardProps) {
  const statusTone =
    configured === 0
      ? 'text-warn-amber'
      : failed > 0 || credentialsMode === 'firestore_degraded'
        ? 'text-warn-amber'
        : 'text-signal-green'

  return (
    <section className="my-2 border border-grid-border bg-surface/60 p-2 font-mono">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary-fg">Source Health</p>
          <p className={`mt-1 text-[10px] uppercase tracking-[0.12em] ${statusTone}`}>
            {configured === 0 ? 'NO SOURCES CONFIGURED' : `${healthy}/${enabled} SOURCES HEALTHY`}
          </p>
        </div>
        <div className="text-right text-[10px] uppercase tracking-[0.1em] text-muted-fg">
          <p>LAST_PULL: {lastPullAt ? formatRelativeTime(lastPullAt) : 'NEVER'}</p>
          <p className={credentialsMode === 'firestore_degraded' ? 'text-warn-amber' : 'text-muted-fg'}>
            {modeLabel(credentialsMode)}
          </p>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] uppercase tracking-[0.08em] text-muted-fg sm:grid-cols-4">
        <span className="border border-grid-border bg-app-bg px-2 py-1">CONFIGURED:{configured}</span>
        <span className="border border-grid-border bg-app-bg px-2 py-1">ENABLED:{enabled}</span>
        <span className="border border-grid-border bg-app-bg px-2 py-1">HEALTHY:{healthy}</span>
        <span className="border border-grid-border bg-app-bg px-2 py-1">FAILED:{failed}</span>
      </div>

      {(lastError || credentialsMessage) && (
        <p className="mt-2 line-clamp-2 text-[11px] leading-4 text-muted-fg">
          <span className="uppercase text-warn-amber">Diagnostic:</span> {lastError ?? credentialsMessage}
        </p>
      )}

      {sources.length > 0 && (
        <div className="mt-2 flex gap-1 overflow-x-auto pb-1 feed-scroll">
          {sources.map((source) => (
            <span
              className="shrink-0 border border-grid-border bg-app-bg px-2 py-1 text-[10px] uppercase tracking-[0.08em] text-muted-fg"
              key={source.id}
              title={source.lastError ?? source.notes}
            >
              <span className={source.status === 'live' ? 'text-signal-green' : source.status === 'degraded' ? 'text-warn-amber' : 'text-muted-fg'}>
                {source.status}
              </span>{' '}
              {source.label}
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
