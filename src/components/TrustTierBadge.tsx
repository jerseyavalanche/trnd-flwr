import type { TrustTier } from '../types/sources'

type TrustTierBadgeProps = {
  tier: TrustTier
}

export function TrustTierBadge({ tier }: TrustTierBadgeProps) {
  const label = tier === 1 ? 'T1 PRIMARY' : tier === 2 ? 'T2 INDEX' : tier === 3 ? 'T3 SENTIMENT' : 'T4 LOCAL'

  return (
    <span className="rounded border border-grid-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-fg">
      {label}
    </span>
  )
}
