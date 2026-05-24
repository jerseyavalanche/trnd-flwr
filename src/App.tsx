import { useCallback, useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/AppShell'
import { BottomNav } from './components/BottomNav'
import type { BottomNavTab } from './components/BottomNav'
import { CategoryFilterBar } from './components/CategoryFilterBar'
import { DecisionsDashboard } from './components/DecisionsDashboard'
import { HeaderBar } from './components/HeaderBar'
import { IngestNowButton } from './components/IngestNowButton'
import { MarketFeedStrip } from './components/MarketFeedStrip'
import { PageHero } from './components/PageHero'
import { RightRail } from './components/RightRail'
import { SearchSortControls } from './components/SearchSortControls'
import { SignalFeedList } from './components/SignalFeedList'
import { SourceCategoryCards } from './components/SourceCategoryCards'
import { SourceHealthCard } from './components/SourceHealthCard'
import { SourceMatrixPanel } from './components/SourceMatrixPanel'
import { SourceFilterBar } from './components/SourceFilterBar'
import { fetchSignals, fetchSourceRegistry, runIngestion } from './lib/api'
import { SIGNAL_PAGE_SIZE } from './lib/feedLimits'
import { filterSignals } from './lib/filters'
import type { CategoryFilter, SignalItem, SortMode } from './types/signals'

function App() {
  const [now, setNow] = useState(new Date())
  const [signals, setSignals] = useState<SignalItem[]>([])
  const [signalTotal, setSignalTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('all')
  const [source, setSource] = useState('all')
  const [sortMode, setSortMode] = useState<SortMode>('ingested')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>()
  const [lastPullAt, setLastPullAt] = useState<string | null>(null)
  const [healthyCount, setHealthyCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [configuredCount, setConfiguredCount] = useState(0)
  const [enabledCount, setEnabledCount] = useState(0)
  const [notConfiguredCount, setNotConfiguredCount] = useState(0)
  const [lastSourceError, setLastSourceError] = useState<string | null>(null)
  const [credentialsMode, setCredentialsMode] = useState<'firestore_connected' | 'firestore_degraded' | 'source_only'>()
  const [credentialsMessage, setCredentialsMessage] = useState<string>()
  const [sourceStatuses, setSourceStatuses] = useState<Awaited<ReturnType<typeof fetchSourceRegistry>>['sources']>([])
  const [ingesting, setIngesting] = useState(false)
  const [ingestMessage, setIngestMessage] = useState<string>()
  const [navTab, setNavTab] = useState<BottomNavTab>('signals')

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const loadRegistry = useCallback(async () => {
    const registry = await fetchSourceRegistry()
    setSourceStatuses(registry.sources)
    setLastPullAt(registry.lastPullAt ?? null)
    setHealthyCount(registry.healthy ?? 0)
    setFailedCount(registry.failed ?? 0)
    setConfiguredCount(registry.configured ?? registry.sources.length)
    setEnabledCount(registry.enabled ?? registry.sources.filter((sourceStatus) => sourceStatus.enabled).length)
    setNotConfiguredCount(registry.notConfigured ?? (registry.sources.length === 0 ? 1 : 0))
    setLastSourceError(registry.lastError ?? registry.error ?? null)
    setCredentialsMode(registry.credentialsMode)
    setCredentialsMessage(registry.credentialsMessage)
  }, [])

  const loadData = useCallback(async () => {
    setLoading(true)
    const [signalResult] = await Promise.all([fetchSignals({ limit: SIGNAL_PAGE_SIZE, offset: 0 }), loadRegistry()])
    setSignals(signalResult.signals)
    setSignalTotal(signalResult.total ?? signalResult.signals.length)
    setLoadError(signalResult.error)
    setLoading(false)
  }, [loadRegistry])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const hasRealScores = useMemo(() => signals.some((signal) => signal.score > 0), [signals])
  const effectiveSortMode = !hasRealScores && (sortMode === 'score' || sortMode === 'confidence') ? 'ingested' : sortMode

  const filteredSignals = useMemo(
    () =>
      filterSignals(signals, {
        search,
        category,
        source,
        trustTier: 'all',
        group: 'all',
        sortMode: effectiveSortMode,
      }),
    [signals, search, category, source, effectiveSortMode],
  )

  const handleIngest = async () => {
    setIngesting(true)
    const result = await runIngestion()
    const errorText = result.errors.length > 0 ? ` ERRORS:${result.errors.length}` : ''

    if (result.status === 'not_configured') {
      setIngestMessage(result.message ?? 'Set TRND_FLWR_RSS_FEEDS or NEWS_RSS_FEEDS.')
    } else {
      setIngestMessage(
        `${result.message ?? 'Pull complete.'} SOURCES:${result.sourcesSucceeded ?? 0}/${result.sourcesAttempted ?? 0} FAILED:${result.sourcesFailed ?? 0} FETCHED:${result.itemsFetched ?? result.records.length} INSERTED:${result.itemsInserted ?? result.addedCount} UPDATED:${result.itemsUpdated ?? result.updatedCount ?? 0}${errorText}`,
      )
    }

    await loadData()
    setIngesting(false)
  }

  const total24h = signals.length
  const archivedCount = Math.max(0, signalTotal - signals.length)

  return (
    <AppShell>
      <MarketFeedStrip />
      <HeaderBar enabled={enabledCount} healthy={healthyCount} lastPullAt={lastPullAt} now={now} />

      <main className="mx-auto max-w-[1240px] px-4">
        <PageHero>
          <IngestNowButton
            disabled={configuredCount === 0 || notConfiguredCount > 0}
            loading={ingesting || loading}
            onIngest={handleIngest}
          />
          <button
            className="border border-grid-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-fg transition hover:border-cyan hover:text-cyan"
            onClick={() => setNavTab('signals')}
            type="button"
          >
            Source Health
          </button>
          <button
            className="border border-grid-border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-primary-fg transition hover:border-cyan hover:text-cyan"
            onClick={() => setNavTab('sources')}
            type="button"
          >
            Source Matrix
          </button>
        </PageHero>

        <p className="border-b border-grid-border py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-fg">
          LIVE_SIGNALS:{total24h} FILTERED:{filteredSignals.length} STORED:{signalTotal || signals.length}
          {archivedCount > 0 && (
            <>
              {' '}
              <a className="text-cyan hover:underline" href="/archive">
                ARCHIVED_LINKS:{archivedCount}
              </a>
            </>
          )}{' '}
          CONNECTED_SOURCES:{healthyCount}/{enabledCount}
        </p>

        {ingestMessage && (
          <p className="border-b border-grid-border py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-muted-fg">
            {ingestMessage}
          </p>
        )}

        <SourceHealthCard
          configured={configuredCount}
          credentialsMessage={credentialsMessage ?? loadError}
          credentialsMode={credentialsMode}
          enabled={enabledCount}
          failed={failedCount}
          healthy={healthyCount}
          lastError={lastSourceError ?? loadError}
          lastPullAt={lastPullAt}
          sources={sourceStatuses}
        />
        <SourceCategoryCards signals={signals} sourceStatuses={sourceStatuses} />
        <SearchSortControls
          hasRealScores={hasRealScores}
          search={search}
          sortMode={effectiveSortMode}
          onSearchChange={setSearch}
          onSortModeChange={setSortMode}
        />
        <CategoryFilterBar selected={category} onChange={setCategory} />
        <SourceFilterBar selected={source} signals={signals} onChange={setSource} />

        {navTab === 'signals' && (
          <>
            {loading ? (
              <p className="py-8 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-fg">Loading signals...</p>
            ) : (
              <>
                <div className="grid gap-3 xl:grid-cols-[1fr_320px]">
                  <div>
                    <SignalFeedList signals={filteredSignals} />
                    {archivedCount > 0 && (
                      <p className="mb-24 mt-2 border border-grid-border px-3 py-2 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-muted-fg">
                        <a className="text-cyan hover:underline" href="/archive">
                          View archived links ({archivedCount} stored, {signals.length} in live feed)
                        </a>
                      </p>
                    )}
                  </div>
                  <div className="hidden xl:block">
                    <RightRail
                      failed={failedCount}
                      healthy={healthyCount}
                      lastPullAt={lastPullAt}
                      signals={signals}
                      sourceStatuses={sourceStatuses}
                    />
                  </div>
                </div>
                <div className="mt-3 xl:hidden">
                  <RightRail
                    failed={failedCount}
                    healthy={healthyCount}
                    lastPullAt={lastPullAt}
                    signals={signals}
                    sourceStatuses={sourceStatuses}
                  />
                </div>
              </>
            )}
          </>
        )}

        {navTab === 'decisions' && <DecisionsDashboard signals={filteredSignals} />}

        {navTab === 'sources' && (
          <SourceMatrixPanel
            configuredCount={configuredCount}
            ingesting={ingesting || loading}
            signals={signals}
            sourceStatuses={sourceStatuses}
            onPullSources={handleIngest}
          />
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
