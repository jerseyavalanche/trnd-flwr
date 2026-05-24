import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/AppShell'
import { BottomNav } from './components/BottomNav'
import { CategoryCountsPanel } from './components/CategoryCountsPanel'
import { CategoryFilterBar } from './components/CategoryFilterBar'
import { ErrorState } from './components/ErrorState'
import { HeaderBar } from './components/HeaderBar'
import { IngestNowButton } from './components/IngestNowButton'
import { LiveSignalsHeader } from './components/LiveSignalsHeader'
import { MarketFeedStrip } from './components/MarketFeedStrip'
import { PageHero } from './components/PageHero'
import { SearchSortControls } from './components/SearchSortControls'
import { SignalFeedList } from './components/SignalFeedList'
import { SourceFilterBar } from './components/SourceFilterBar'
import { SourceHealthPanel } from './components/SourceHealthPanel'
import { createTrendInsight, fetchSignals, fetchSourceRegistry, runIngestion } from './lib/api'
import { filterSignals } from './lib/filters'
import type { CategoryFilter, SignalItem, SortMode } from './types/signals'

function App() {
  const [now, setNow] = useState(new Date())
  const [signals, setSignals] = useState<SignalItem[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [source, setSource] = useState('all')
  const [sortMode, setSortMode] = useState<SortMode>('time')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>()
  const [registryCount, setRegistryCount] = useState(0)
  const [registryMessage, setRegistryMessage] = useState<string>()
  const [lastPullAt, setLastPullAt] = useState<string | null>(null)
  const [healthyCount, setHealthyCount] = useState(0)
  const [notConfiguredCount, setNotConfiguredCount] = useState(0)
  const [ingesting, setIngesting] = useState(false)
  const [ingestMessage, setIngestMessage] = useState<string>()
  const [insightText, setInsightText] = useState('')
  const [insightMessage, setInsightMessage] = useState<string>()
  const [generatingInsight, setGeneratingInsight] = useState(false)
  const [navTab, setNavTab] = useState<'signals' | 'content' | 'export'>('signals')

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadRegistry = useCallback(async () => {
    const registry = await fetchSourceRegistry()
    setRegistryCount(registry.sources.length)
    setRegistryMessage(registry.message ?? registry.error)
    setLastPullAt(registry.lastPullAt ?? null)
    setHealthyCount(registry.healthy ?? 0)
    setNotConfiguredCount(registry.notConfigured ?? (registry.sources.length === 0 ? 1 : 0))
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [signalResult] = await Promise.all([fetchSignals(), loadRegistry()])
    setSignals(signalResult.signals)
    setLoadError(signalResult.error)
    setLoading(false)
  }, [loadRegistry])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const filteredSignals = useMemo(
    () =>
      filterSignals(signals, {
        search,
        category,
        source,
        trustTier: 'all',
        group: 'all',
        sortMode,
      }),
    [signals, search, category, source, sortMode],
  )

  const handleIngest = async () => {
    setIngesting(true)
    const result = await runIngestion()
    const errorText = result.errors.length > 0 ? ` ERRORS:${result.errors.length}` : ''

    if (result.status === 'not_configured') {
      setIngestMessage('No enabled real sources are configured yet.')
    } else {
      setIngestMessage(
        `${result.message ?? 'Pull complete.'} ADDED:${result.addedCount} SKIPPED_DUPES:${result.skippedDuplicateCount}${errorText}`,
      )
    }

    await loadData()
    setIngesting(false)
  }

  const handleGenerateInsight = async () => {
    setGeneratingInsight(true)
    setInsightMessage(undefined)

    try {
      const insight = await createTrendInsight(filteredSignals.map((signal) => signal.id))
      setInsightText(insight.generatedText)
      setInsightMessage('Trend insight saved. Ready to copy.')
    } catch (error) {
      setInsightMessage(error instanceof Error ? error.message : 'Unable to generate trend insight.')
    } finally {
      setGeneratingInsight(false)
    }
  }

  const handleCopyInsight = async () => {
    await navigator.clipboard.writeText(insightText)
    setInsightMessage('Trend insight copied.')
  }

  const total24h = signals.length

  return (
    <AppShell>
      <HeaderBar now={now} />
      <MarketFeedStrip />

      <main className="mx-auto max-w-[1100px] px-4">
        <PageHero />

        <LiveSignalsHeader loaded={filteredSignals.length} total24h={total24h}>
          <IngestNowButton loading={ingesting || loading} onIngest={handleIngest} />
        </LiveSignalsHeader>

        <p className="border-b border-grid-border py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-fg">
          REGISTRY_SOURCES:{registryCount} FEED_ITEMS:{filteredSignals.length} HEALTHY:{healthyCount}{' '}
          NOT_CONFIGURED:{notConfiguredCount} LAST_PULL:{lastPullAt ?? 'Never'}
        </p>

        {registryMessage && (
          <p className="border-b border-grid-border py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-fg">
            {registryMessage}
          </p>
        )}

        {ingestMessage && (
          <p className="border-b border-grid-border py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-fg">
            {ingestMessage}
          </p>
        )}

        <SourceHealthPanel signals={signals} />
        <CategoryCountsPanel signals={signals} />
        <SearchSortControls search={search} sortMode={sortMode} onSearchChange={setSearch} onSortModeChange={setSortMode} />
        <CategoryFilterBar selected={category} onChange={setCategory} />
        <SourceFilterBar selected={source} signals={signals} onChange={setSource} />
        {loadError && <ErrorState message={loadError} />}

        {navTab === 'signals' && (
          <>
            {loading ? (
              <p className="py-8 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-fg">Loading signals...</p>
            ) : (
              <SignalFeedList signals={filteredSignals} />
            )}
          </>
        )}

        {navTab === 'content' && (
          <section className="terminal-panel my-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-fg">Trend Insight</p>
                <p className="mt-1 text-sm text-muted-fg">
                  Generate copyable text from the currently visible persisted signals only.
                </p>
              </div>
              <button
                className="border border-grid-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-fg transition hover:border-cyan hover:text-cyan disabled:opacity-50"
                disabled={generatingInsight || filteredSignals.length === 0}
                onClick={handleGenerateInsight}
                type="button"
              >
                {generatingInsight ? 'GENERATING...' : 'GENERATE_INSIGHT'}
              </button>
            </div>

            {insightMessage && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-fg">{insightMessage}</p>
            )}

            {insightText && (
              <div className="mt-4">
                <textarea
                  className="h-52 w-full border border-grid-border bg-surface p-3 font-mono text-[11px] leading-5 text-primary-fg"
                  readOnly
                  value={insightText}
                />
                <button
                  className="mt-2 border border-grid-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-fg transition hover:border-cyan hover:text-cyan"
                  onClick={handleCopyInsight}
                  type="button"
                >
                  COPY_INSIGHT
                </button>
              </div>
            )}
          </section>
        )}

        {navTab === 'export' && (
          <p className="py-8 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-fg">
            Export view not wired yet.
          </p>
        )}
      </main>

      <BottomNav active={navTab} onChange={setNavTab} />
    </AppShell>
  )
}

export default App
