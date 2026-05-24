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

export type SourceCategory = 'official' | 'market' | 'tech_ai' | 'news_narrative' | 'social_culture' | 'prediction';

export type TrustTier = 'official' | 'market' | 'news' | 'social' | 'prediction';

export type SourceStatusValue = 'LIVE' | 'DEGRADED' | 'OFFLINE' | 'AUTH NEEDED' | 'LIMITED' | 'PLANNED';

export interface SourceHealth {
  source: string;
  category: SourceCategory;
  trust_tier: TrustTier;
  status: SourceStatusValue;
  url: string;
  timestamp: string;
  last_fetch_time: string;
  card_count: number;
  latest_error_message?: string;
}

export type MarketTicker = {
  symbol: string;
  label: string;
  price: string;
  change: string;
  changePercent: string;
  trend: 'up' | 'down' | 'flat';
};

export type SourceStatus = {
  source: string;
  count: number;
  status: SourceStatusValue;
};
