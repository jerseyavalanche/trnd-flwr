export type SourceGroup =
  | 'official_reality'
  | 'market_finance'
  | 'tech_ai'
  | 'news_narrative'
  | 'social_culture'
  | 'prediction'
  | 'cyber_infrastructure'
  | 'local_operator'

export type SourceCategory =
  | 'official'
  | 'market'
  | 'macro'
  | 'tech'
  | 'ai'
  | 'news'
  | 'social'
  | 'prediction'
  | 'cyber'
  | 'local'
  | 'cultural'
  | 'economic'

export type TrustTier = 1 | 2 | 3 | 4

export type SourceConnectionStatus = 'live' | 'degraded' | 'offline' | 'auth_needed' | 'limited' | 'planned'

export type SourceStatus = {
  id: string
  label: string
  group: SourceGroup
  category: SourceCategory
  trustTier: TrustTier
  status: SourceConnectionStatus
  count24h: number
  lastSuccessAt?: string
  lastErrorAt?: string
  lastError?: string
  authRequired: boolean
  enabled: boolean
  freshnessMinutes: number
  notes: string
}

export const sourceGroups: SourceGroup[] = [
  'official_reality',
  'market_finance',
  'tech_ai',
  'news_narrative',
  'social_culture',
  'prediction',
  'cyber_infrastructure',
  'local_operator',
]

export const sourceCategories: SourceCategory[] = [
  'official',
  'market',
  'macro',
  'tech',
  'ai',
  'news',
  'social',
  'prediction',
  'cyber',
  'local',
]
