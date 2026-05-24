import type { ReactNode } from 'react'

type LiveSignalsHeaderProps = {
  total24h: number
  loaded: number
  children?: ReactNode
}

export function LiveSignalsHeader({ total24h, loaded, children }: LiveSignalsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-grid-border py-2">
      <div className="flex flex-wrap items-center gap-4 font-mono text-[11px] uppercase tracking-[0.1em]">
        <span className="flex items-center gap-2 text-primary-fg">
          <span className="pulse-dot" />
          LIVE SIGNALS
        </span>
        <span className="text-muted-fg">
          <span className="text-primary-fg">{total24h}</span> / 24H
        </span>
        <span className="text-muted-fg">
          <span className="text-primary-fg">{loaded}</span> LOADED
        </span>
      </div>
      {children}
    </div>
  )
}
