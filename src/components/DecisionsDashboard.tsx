import { useMemo, useState } from 'react'
import { getTopTrends, signalsToRawSignals } from '../lib/trends'
import type { SignalItem } from '../types/signals'

type DecisionsDashboardProps = {
  signals: SignalItem[]
}

type DecisionsTab = 'TOP_10' | 'SECTORS' | 'RISKS'

const tabs: DecisionsTab[] = ['TOP_10', 'SECTORS', 'RISKS']

export function DecisionsDashboard({ signals }: DecisionsDashboardProps) {
  const [activeTab, setActiveTab] = useState<DecisionsTab>('TOP_10')
  const [expandedTrend, setExpandedTrend] = useState<string | null>(null)

  const rawSignals = useMemo(() => signalsToRawSignals(signals), [signals])
  const topTrends = useMemo(() => getTopTrends(rawSignals), [rawSignals])

  const sectorRollup = useMemo(() => {
    const counts: Record<string, number> = {}
    rawSignals
      .flatMap((signal) => signal.sectors || [])
      .forEach((sector) => {
        counts[sector] = (counts[sector] || 0) + 1
      })

    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [rawSignals])

  return (
    <section className="my-3 border border-slate-900 bg-[#050b0d] p-2 font-mono text-slate-200 selection:bg-cyan-500/30">
      <div className="mb-2 flex items-center justify-between gap-3 border border-slate-900 bg-[#0a1215] p-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-2 w-2 shrink-0 bg-cyan-500 shadow-[0_0_8px_#00f2ff]" />
          <span className="truncate text-[11px] font-black uppercase tracking-widest text-slate-200">
            DECISIONS_ENGINE // INTEL_COMPILATION
          </span>
        </div>
        <div className="shrink-0 text-[10px] uppercase text-slate-500">
          ALGO_VERSION: <span className="font-bold text-cyan-400">JACCARD_v0.34</span>
        </div>
      </div>

      <div className="mb-2 flex gap-1 border border-slate-900 bg-[#070e10] p-1">
        {tabs.map((tab) => (
          <button
            className={`flex-1 border py-1 text-center text-[11px] font-bold uppercase tracking-widest transition-colors ${
              activeTab === tab
                ? 'border-cyan-800 bg-cyan-950/40 text-cyan-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
            key={tab}
            onClick={() => setActiveTab(tab)}
            type="button"
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {activeTab === 'TOP_10' && (
        <div className="space-y-2">
          {topTrends.length === 0 ? (
            <div className="border border-dashed border-slate-800 p-3 text-center text-[11px] uppercase tracking-[0.12em] text-slate-600">
              NO HAUL DETECTED. RUN AGENT FEEDS TO POPULATE.
            </div>
          ) : (
            topTrends.map((trend, index) => {
              const isExpanded = expandedTrend === trend.primary_name

              return (
                <div
                  className="border border-slate-900 bg-[#060c0e] transition-all hover:border-slate-800"
                  key={`${trend.primary_name}-${index}`}
                >
                  <button
                    className="flex w-full cursor-pointer select-none flex-wrap items-center justify-between gap-2 p-2 text-left"
                    onClick={() => setExpandedTrend(isExpanded ? null : trend.primary_name)}
                    type="button"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="text-[11px] font-black text-cyan-500">
                        #{String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="border border-slate-900 bg-slate-950 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">
                        SCORE: {trend.rank_score}
                      </span>
                      <h3 className="max-w-xl truncate text-xs font-bold text-slate-200">{trend.primary_name}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      {trend.tickers.slice(0, 3).map((ticker) => (
                        <span
                          className="border border-slate-800 bg-slate-950 px-1 text-[9px] font-bold uppercase text-slate-400"
                          key={ticker}
                        >
                          ${ticker}
                        </span>
                      ))}
                      <span className="ml-1 text-xs font-bold text-slate-600">{isExpanded ? '[-]' : '[+]'}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-3 border-t border-slate-900 bg-[#050b0d] p-2 text-[11px]">
                      <div>
                        <div className="mb-1 font-bold uppercase tracking-wider text-slate-500">
                          CLUSTERED MEMBER PATHS ({trend.member_names.length}):
                        </div>
                        <ul className="space-y-1 border-l border-slate-800 pl-2">
                          {trend.member_names.map((name, memberIndex) => (
                            <li className="truncate text-slate-400" key={`${name}-${memberIndex}`}>
                              &gt; {name}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid gap-3 pt-1 md:grid-cols-2">
                        <div>
                          <div className="mb-1 font-bold uppercase tracking-wider text-slate-500">
                            SOURCE CONCENTRATION:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(trend.sources_breakdown).map(([source, pct]) => (
                              <span className="border border-slate-900 bg-[#0a1215] px-1.5 py-0.5 text-slate-300" key={source}>
                                {source.toUpperCase()}: <span className="font-bold text-cyan-400">{pct}%</span>
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 font-bold uppercase tracking-wider text-slate-500">
                            MAPPED VECTOR SECTORS:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {trend.sectors.map((sector) => (
                              <span
                                className="border border-slate-900 bg-slate-950 px-1 text-[10px] uppercase text-slate-400"
                                key={sector}
                              >
                                {sector}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'SECTORS' && (
        <div className="space-y-2 border border-slate-900 bg-[#060c0e] p-2">
          <div className="border-b border-slate-900 pb-1 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            SECTOR VOLUMES DETECTED BY HARVESTERS
          </div>
          {sectorRollup.length === 0 ? (
            <p className="py-3 text-center text-[11px] uppercase tracking-[0.12em] text-slate-600">NO SECTOR MAP AVAILABLE.</p>
          ) : (
            sectorRollup.map(([sector, count]) => (
              <div
                className="flex items-center justify-between gap-3 border-b border-slate-900/40 py-1 text-xs last:border-0"
                key={sector}
              >
                <span className="truncate uppercase tracking-wide text-slate-300">DIR {sector}</span>
                <span className="shrink-0 border border-slate-800 bg-[#0a1215] px-2 text-[11px] font-bold uppercase text-cyan-400">
                  {count} {count === 1 ? 'SIGNAL' : 'SIGNALS'}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'RISKS' && (
        <div className="border border-slate-900 bg-[#060c0e] p-3 text-center">
          <div className="mb-1 text-xs font-bold uppercase tracking-widest text-rose-500">ANOMALOUS RISK ARRAYS</div>
          <p className="mx-auto max-w-md text-[11px] leading-relaxed text-slate-500">
            High echo-chamber metrics, missing ticker maps, generic sector sprawl, and stale data chains trigger penalties inside the
            ranking engine.
          </p>
        </div>
      )}
    </section>
  )
}
