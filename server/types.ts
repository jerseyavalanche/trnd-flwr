export interface SignalCard {
  id: string;
  title: string;
  summary?: string;
  source: string;
  source_url?: string;
  source_category?: SourceCategory;
  source_trust_tier?: TrustTier;
  image_url?: string;
  category?: string;
  ticker?: string;
  topic?: string;
  signal_strength?: number;
  delta?: number;
  timestamp: string;
  why_it_matters?: string;
  data_status: 'sample' | 'live' | 'stale' | 'unavailable';
}

export type UiSourceGroup =
  | 'official_reality'
  | 'market_finance'
  | 'tech_ai'
  | 'news_narrative'
  | 'social_culture'
  | 'prediction'
  | 'cyber_infrastructure'
  | 'local_operator';

export type UiSourceCategory =
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
  | 'economic';

export type UiTrustTier = 1 | 2 | 3 | 4;

export interface SignalItem {
  id: string;
  displayNumber: number;
  sourceId: string;
  sourceLabel: string;
  category: UiSourceCategory;
  group: UiSourceGroup;
  trustTier: UiTrustTier;
  score: number;
  title: string;
  url: string;
  summary: string;
  imageUrl?: string;
  domain: string;
  author?: string;
  publishedAt: string;
  ingestedAt: string;
  tags: string[];
  rawType: string;
  isPrediction: boolean;
  isOfficial: boolean;
  isSocial: boolean;
  isSecurity: boolean;
  isMarketMoving: boolean;
  symbol?: string | null;
  assetClass?: string | null;
  direction?: string | null;
  confidence?: number | null;
  sourceUrl?: string | null;
  dedupeKey?: string;
  rawPayloadRef?: string | null;
  rawPayloadSummary?: string | null;
}

export interface PersistedSignalRecord {
  id: string;
  symbol: string | null;
  assetClass: string | null;
  direction: string | null;
  confidence: number | null;
  source: string;
  sourceUrl: string | null;
  title: string;
  summary: string | null;
  publishedAt: string | null;
  ingestedAt: string;
  dedupeKey: string;
  rawPayloadRef?: string | null;
  rawPayloadSummary?: string | null;
}

export interface IncomingSignalRecord {
  symbol?: string | null;
  assetClass?: string | null;
  direction?: string | null;
  confidence?: number | null;
  source: string;
  sourceUrl?: string | null;
  title: string;
  summary?: string | null;
  publishedAt?: string | null;
  rawPayloadRef?: string | null;
  rawPayloadSummary?: string | null;
}

export interface IngestError {
  source: string;
  message: string;
}

export interface IngestResult {
  addedCount: number;
  skippedDuplicateCount: number;
  records: PersistedSignalRecord[];
  errors: IngestError[];
}

export interface TrendInsightRecord {
  signalIds: string[];
  generatedText: string;
  createdAt: string;
  sourceCount: number;
  symbols: string[];
  userAction: "copyable_trend_insight";
}

export type SourceCategory = 'official' | 'market' | 'tech_ai' | 'news_narrative' | 'social_culture' | 'prediction';

export type TrustTier = 'official' | 'market' | 'news' | 'social' | 'prediction';

export type SourceStatus = 'LIVE' | 'DEGRADED' | 'OFFLINE' | 'AUTH NEEDED' | 'LIMITED' | 'PLANNED';

export interface SourceHealth {
  source: string;
  category: SourceCategory;
  trust_tier: TrustTier;
  status: SourceStatus;
  url: string;
  timestamp: string;
  last_fetch_time: string;
  card_count: number;
  latest_error_message?: string;
}

export type UiSourceConnectionStatus = 'live' | 'degraded' | 'offline' | 'auth_needed' | 'limited' | 'planned';

export interface UiSourceStatus {
  id: string;
  label: string;
  group: UiSourceGroup;
  category: UiSourceCategory;
  trustTier: UiTrustTier;
  status: UiSourceConnectionStatus;
  count24h: number;
  lastSuccessAt?: string;
  lastErrorAt?: string;
  lastError?: string;
  authRequired: boolean;
  enabled: boolean;
  freshnessMinutes: number;
  notes: string;
}

export interface CanonicalSource {
  source: string;
  category: SourceCategory;
  trust_tier: TrustTier;
  status: SourceStatus;
  url: string;
  timestamp: string;
  last_fetch_time: string;
  card_count: number;
  latest_error_message?: string;
}
