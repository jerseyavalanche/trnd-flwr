import { formatObservatoryTime } from '../lib/time'

type HeaderBarProps = {
  now: Date
}

export function HeaderBar({ now }: HeaderBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-grid-border bg-app-bg">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.08em] text-primary-fg">
          <span className="pulse-dot" />
          <span>TRND_FLWR</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-fg">
          <span>OBSERVATORY</span>
          <span className="text-primary-fg">{formatObservatoryTime(now)}</span>
        </div>
      </div>
    </header>
  )
}
