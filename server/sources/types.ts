export type SourceCategory =
  | "crypto"
  | "options"
  | "market"
  | "institutional"
  | "news"
  | "social"
  | "prediction"
  | "copytrader"
  | "technology"
  | "culture"
  | "other";

export type SourceEngineStatus =
  | "connected"
  | "needs_api_key"
  | "needs_oauth"
  | "paid_required"
  | "platform_limited"
  | "disabled"
  | "rate_limited"
  | "error"
  | "unavailable";

export type SourceConnectionType =
  | "public_api"
  | "api_key"
  | "oauth"
  | "vendor"
  | "scrape_possible"
  | "manual"
  | "unknown";

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

export type NormalizedIngestedItem = {
  source: string;
  sourceId: string;
  sourceCategory: SourceCategory;
  sourceStatus: SourceEngineStatus;
  externalId?: string;
  title: string;
  summary?: string;
  url?: string;
  imageUrl?: string | null;
  symbol?: string | null;
  assetClass?: SignalAssetClass;
  signalType: SignalType;
  direction?: SignalDirection;
  confidence?: number | null;
  importance?: SignalImportance;
  publishedAt?: string | null;
  ingestedAt: string;
  lastSeenAt: string;
  seenCount: number;
  raw: unknown;
};

export type SourceStatus = {
  id: string;
  name: string;
  category: SourceCategory;
  url: string;
  enabled: boolean;
  status: SourceEngineStatus;
  connectionType: SourceConnectionType;
  docsUrl?: string;
  needsApiKey: boolean;
  paidRequired: boolean;
  platformLimited?: boolean;
  envVars?: string[];
  lastAttemptAt?: string | null;
  lastSuccessAt?: string | null;
  lastError?: string | null;
  latestItemCount: number;
  totalItemCount: number;
};

export type SourceHealthResult = {
  ok: boolean;
  status: SourceEngineStatus;
  message?: string;
};

export type SourceAdapter = {
  id: string;
  name: string;
  category: SourceCategory;
  url: string;
  docsUrl?: string;
  enabledByDefault: boolean;
  requiresApiKey: boolean;
  paidRequired: boolean;
  platformLimited?: boolean;
  envVars?: string[];
  connectionType: SourceConnectionType;
  healthCheck: () => Promise<SourceHealthResult>;
  fetchLatest: () => Promise<NormalizedIngestedItem[]>;
};

export type IngestRunSummary = {
  runId: string;
  status: "ok" | "partial" | "empty" | "storage_error" | "error";
  message: string;
  sourcesAttempted: number;
  sourcesSucceeded: number;
  sourcesFailed: number;
  itemsFetched: number;
  itemsInserted: number;
  itemsUpdated: number;
  errors: { source: string; message: string; httpStatus?: number; retrySafe?: boolean; credentialsMissing?: boolean }[];
  errorsBySource: Record<string, string>;
};
