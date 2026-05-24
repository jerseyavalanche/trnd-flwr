type BottomNavTab = 'signals' | 'content' | 'export'

type BottomNavProps = {
  active: BottomNavTab
  onChange: (tab: BottomNavTab) => void
}

const tabs: { id: BottomNavTab; label: string }[] = [
  { id: 'signals', label: 'SIGNALS' },
  { id: 'content', label: 'CONTENT' },
  { id: 'export', label: 'EXPORT' },
]

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-grid-border bg-app-bg/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] justify-around px-4 py-2">
        {tabs.map((tab) => (
          <button
            className={`flex flex-col items-center gap-1 font-mono text-[10px] uppercase tracking-[0.14em] ${
              active === tab.id ? 'text-cyan' : 'text-muted-fg'
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
