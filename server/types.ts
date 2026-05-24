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
  | 'economic'
  | 'crypto'
  | 'options'
  | 'institutional'
  | 'insider'
  | 'copytrader'
  | 'other';

export type NormalizedSourceCategory =
  | "crypto"
  | "options"
  | "market"
  | "institutional"
  | "news"
  | "social"
  | "prediction"
  | "copytrader";

export type NormalizedSourceStatus =
  | "connected"
  | "needs_api_key"
  | "needs_oauth"
  | "paid_required"
  | "disabled"
  | "rate_limited"
  | "error"
  | "unavailable";

export type SignalAssetClass = "stock" | "crypto" | "forex" | "option" | "event" | "unknown";

export type SignalType =
  | "news"
  | "whale_move"
  | "options_flow"
  | "insider_trade"
  | "institutional_filing"
  | "social_attention"
  | "prediction_market"
  | "price_move"
  | "dex_activity"
  | "trader_profile"
  | "source_status";

export type SignalDirection = "bullish" | "bearish" | "neutral" | "unknown";

export type SignalImportance = "low" | "medium" | "high" | "urgent";

export type SourceFeed = {
  url: string;
  sourceType: "rss" | "unknown";
  configuredFrom: "TRND_FLWR_RSS_FEEDS" | "NEWS_RSS_FEEDS";
};

export type IngestedItem = {
  id: string;
  title: string;
  url: string;
  sourceDomain: string;
  sourceName?: string;
  publishedAt?: string;
  category?: string;
  summary?: string;
  imageUrl?: string;
  rawExcerpt?: string;
  pulledAt: string;
};

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
  lastSeenAt?: string | null;
  seenCount?: number | null;
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
  externalId?: string | null;
  signalType?: SignalType | null;
  importance?: SignalImportance | null;
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
  sourceCategory?: NormalizedSourceCategory | null;
  sourceStatus?: NormalizedSourceStatus | null;
  sourceUrl: string | null;
  sourceDomain?: string | null;
  externalId?: string | null;
  title: string;
  summary: string | null;
  imageUrl?: string | null;
  signalType?: SignalType | null;
  importance?: SignalImportance | null;
  rawJson?: unknown;
  publishedAt: string | null;
  ingestedAt: string;
  lastSeenAt: string;
  seenCount: number;
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
  sourceCategory?: NormalizedSourceCategory | null;
  sourceStatus?: NormalizedSourceStatus | null;
  sourceUrl?: string | null;
  sourceDomain?: string | null;
  externalId?: string | null;
  title: string;
  summary?: string | null;
  imageUrl?: string | null;
  signalType?: SignalType | null;
  importance?: SignalImportance | null;
  publishedAt?: string | null;
  category?: UiSourceCategory | null;
  rawJson?: unknown;
  rawPayloadRef?: string | null;
  rawPayloadSummary?: string | null;
}

export interface IngestError {
  source: string;
  message: string;
}

export interface IngestResult {
  addedCount: number;
  updatedCount: number;
  skippedDuplicateCount: number;
  records: PersistedSignalRecord[];
  errors: IngestError[];
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
  lastAttemptAt?: string;
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
