import type { TrustTierFilter } from '../types/signals'

type TrustTierFilterBarProps = {
  selected: TrustTierFilter
  onChange: (value: TrustTierFilter) => void
}

const tiers: { id: TrustTierFilter; label: string }[] = [
  { id: 'all', label: 'ALL TRUST' },
  { id: 1, label: 'T1 OFFICIAL' },
  { id: 2, label: 'T2 INDEX' },
  { id: 3, label: 'T3 SENTIMENT' },
  { id: 4, label: 'T4 LOCAL' },
]

export function TrustTierFilterBar({ selected, onChange }: TrustTierFilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto py-1">
      {tiers.map((tier) => (
        <button
          className={`shrink-0 rounded border px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] transition ${
            selected === tier.id ? 'border-signal-green/50 bg-signal-green/10 text-signal-green' : 'border-grid-border text-muted-fg hover:bg-surface-2'
          }`}
          key={tier.id}
          onClick={() => onChange(tier.id)}
          type="button"
        >
          {tier.label}
        </button>
      ))}
    </div>
  )
}
