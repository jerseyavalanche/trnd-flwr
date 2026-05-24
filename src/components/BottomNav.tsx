export type BottomNavTab = 'signals' | 'sources' | 'decisions' | 'export'

type BottomNavProps = {
  active: BottomNavTab
  onChange: (tab: BottomNavTab) => void
}

const tabs: { id: BottomNavTab; label: string }[] = [
  { id: 'signals', label: 'SIGNALS' },
  { id: 'sources', label: 'SOURCES' },
  { id: 'decisions', label: 'DECISIONS' },
  { id: 'export', label: 'EXPORT' },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-cyan/20 bg-[#050b0d]/95 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] backdrop-blur">
      <div className="mx-auto grid max-w-[720px] grid-cols-4 gap-1 px-3 py-2">
        {tabs.map((tab) => (
          <button
            className={`flex flex-col items-center gap-1 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition ${
              active === tab.id
                ? 'border-cyan/60 bg-cyan/10 text-cyan'
                : 'border-transparent text-muted-fg hover:border-grid-border hover:text-primary-fg'
            }`}
            key={tab.id}
            onClick={() => onChange(tab.id)}
            type="button"
          >
            <span className={`h-2 w-2 rounded-sm ${active === tab.id ? 'bg-cyan' : 'bg-grid-border'}`} />
            {tab.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
