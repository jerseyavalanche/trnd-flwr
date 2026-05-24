import { formatObservatoryTime } from '../lib/time'

type HeaderBarProps = {
  now: Date
  healthy: number
  enabled: number
  lastPullAt?: string | null
}

export function HeaderBar({ now, healthy, enabled, lastPullAt }: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-grid-border bg-app-bg">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-3 px-4 py-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-primary-fg">
            <span className="pulse-dot" />
            <span>TRND_FLWR</span>
          </div>
          <p className="hidden truncate text-[10px] text-muted-fg sm:block">
            Real-time trend intelligence across markets, technology, culture, and emerging narratives.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-fg">
          <span className="border border-grid-border px-2 py-1 text-primary-fg">
            SRC:{healthy}/{enabled}
          </span>
          <span className="hidden sm:inline">LAST:{lastPullAt ? 'PULLED' : 'NEVER'}</span>
          <span className="text-primary-fg">{formatObservatoryTime(now)}</span>
        </div>
      </div>
    </header>
  )
}
