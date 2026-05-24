import type { ClusteredTrend, RawSignal } from '../../types/trends'

/**
 * Computes Jaccard Similarity between two token sets
 * Intersection / Union
 */
function getJaccardSimilarity(str1: string, str2: string): number {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
  const set1 = new Set(clean(str1))
  const set2 = new Set(clean(str2))

  const intersection = new Set([...set1].filter((x) => set2.has(x)))
  const union = new Set([...set1, ...set2])

  if (union.size === 0) return 0
  return intersection.size / union.size
}

/**
 * Normalizes, clusters duplicates via Jaccard (>=0.34), and runs the strict ranking matrix
 */
export function getTopTrends(signals: RawSignal[]): ClusteredTrend[] {
  const clusters: RawSignal[][] = []

  // 1. CLUSTERING LOOP (Jaccard similarity pass)
  signals.forEach((signal) => {
    let matched = false
    for (const cluster of clusters) {
      if (getJaccardSimilarity(signal.title, cluster[0].title) >= 0.34) {
        cluster.push(signal)
        matched = true
        break
      }
    }
    if (!matched) {
      clusters.push([signal])
    }
  })

  // 2. SCORING & AGGREGATION LOOP
  const trends: ClusteredTrend[] = clusters.map((cluster) => {
    const lead = cluster[0]
    const memberNames = cluster.map((s) => s.title)

    const tickers = Array.from(new Set(cluster.flatMap((s) => s.tickers || [])))
    const sectors = Array.from(new Set(cluster.flatMap((s) => s.sectors || [])))

    const totalSignals = cluster.length
    const sourcesBreakdown: Record<string, number> = {}
    cluster.forEach((s) => {
      sourcesBreakdown[s.source] = (sourcesBreakdown[s.source] || 0) + 1
    })
    Object.keys(sourcesBreakdown).forEach((k) => {
      sourcesBreakdown[k] = Math.round((sourcesBreakdown[k] / totalSignals) * 100)
    })

    const baseStrength = cluster.reduce((acc, s) => acc + (s.score || 50), 0) / totalSignals
    const sourceDiversity = Object.keys(sourcesBreakdown).length

    const metrics = {
      strength: Math.min(100, baseStrength),
      confidence: Math.min(100, totalSignals * 20),
      momentum: Math.min(100, sourceDiversity * 25),
      novelty: Math.max(10, 100 - totalSignals * 10),
    }

    let rankScore =
      metrics.strength * 0.25 +
      metrics.confidence * 0.15 +
      metrics.momentum * 0.2 +
      Math.min(100, sourceDiversity * 30) * 0.15 +
      (tickers.length > 0 ? 100 : 0) * 0.15 +
      metrics.novelty * 0.1

    // 3. APPLY HARD PENALTIES
    if (tickers.length === 0) rankScore -= 15
    if (sourceDiversity === 1) rankScore -= 10
    if (tickers.length > 5 || sectors.length > 5) rankScore -= 12

    const maxAgeMs = Date.now() - Math.min(...cluster.map((s) => new Date(s.published_at).getTime()))
    if (maxAgeMs > 48 * 60 * 60 * 1000) rankScore -= 20

    return {
      rank_score: Math.max(0, Math.round(rankScore)),
      primary_name: lead.title,
      member_names: memberNames,
      sources_breakdown: sourcesBreakdown,
      tickers,
      sectors,
      metrics,
    }
  })

  return trends.sort((a, b) => b.rank_score - a.rank_score).slice(0, 10)
}
