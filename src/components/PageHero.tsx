import type { ReactNode } from 'react'

type PageHeroProps = {
  children?: ReactNode
}

export function PageHero({ children }: PageHeroProps) {
  return (
    <section className="border-b border-grid-border py-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-semibold uppercase tracking-[0.04em] text-primary-fg">TRND_FLWR</h1>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-cyan">Signal Index</p>
          <p className="mt-1 max-w-3xl text-[12px] leading-5 text-muted-fg">
            Real-time trend intelligence across markets, technology, culture, and emerging narratives.
          </p>
        </div>
        {children && <div className="flex flex-wrap gap-2">{children}</div>}
      </div>
    </section>
  )
}
