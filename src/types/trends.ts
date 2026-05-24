// PIRATE_DOCK // DATA & SCORING TYPES

export interface RawSignal {
  id: string
  source: string
  category: string
  title: string
  description: string
  url: string
  score: number
  created_at: string
  published_at: string
  tickers?: string[]
  sectors?: string[]
}

export interface ClusteredTrend {
  rank_score: number
  primary_name: string
  member_names: string[]
  sources_breakdown: Record<string, number>
  tickers: string[]
  sectors: string[]
  metrics: {
    strength: number
    confidence: number
    momentum: number
    novelty: number
  }
}
