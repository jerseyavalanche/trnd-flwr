export type WalletWeatherSignalType =
  | "Wallet Cluster"
  | "Liquidity Shift"
  | "Early Accumulation"
  | "Concentrated Wallet"
  | "Thin Market Warning"
  | "Contrarian Movement";

export type WalletReliabilityLabel =
  | "Too Thin"
  | "Interesting"
  | "Consistent"
  | "Volatile"
  | "Suspicious";

export type DataStatus = "sample" | "live" | "stale" | "unavailable";

export interface WalletWeatherSignal {
  id: string;
  marketTitle: string;
  platform: string;
  signalType: WalletWeatherSignalType;
  confidence: number; // 0-100
  risk: number; // 0-100
  activitySummary: string;
  whyItMatters: string;
  whyItMayBeMisleading: string;
  recommendedAction: string;
  sourceUrl?: string;
  observedAt: string; // ISO date
  dataStatus: DataStatus;
}

export interface WalletProfile {
  id: string;
  address: string;
  shortenedAddress: string;
  marketsTraded: string[];
  estimatedWinRate?: number; // 0-100
  averagePositionSize?: string;
  timingPattern: string;
  concentrationRisk: number; // 0-100
  reliabilityLabel: WalletReliabilityLabel;
  notes: string;
  dataStatus: DataStatus;
}

export interface WalletWeatherSummary {
  activeMarketsWatched: number;
  walletsTracked: number;
  unusualActivityFlags: number;
  highRiskSignals: number;
  lastUpdated: string; // ISO date
}
