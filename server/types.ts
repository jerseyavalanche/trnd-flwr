export type SignalSource = 'rss' | 'github' | 'reddit' | 'market' | 'economy' | 'gdelt';

export interface Signal {
  id: string;
  title: string;
  source: SignalSource;
  url: string;
  timestamp: string;
  summary: string;
  score: number;
  metrics: Record<string, number | string>;
  tokens: string[];
}

export interface SourceStatus {
  source: SignalSource;
  status: 'ok' | 'unavailable';
  detail: string;
  updatedAt: string;
}

export interface Theme {
  name: string;
  strength: number;
  acceleration: number;
  confidence: number;
  emotionalIntensity: number;
  evidence: string[];
  linkedSources: SignalSource[];
}

export interface Regime {
  label: string;
  stability: number;
  volatility: number;
  emotionalTemperature: number;
  fragmentation: number;
}

export interface Collision {
  themes: [string, string];
  overlapSignals: number;
  score: number;
}

export interface SystemStatus {
  backend: 'online' | 'offline';
  ingestion: 'ok' | 'degraded';
  storage: { ok: boolean; path: string; error?: string };
  modelSynthesis: { status: 'available' | 'unavailable'; detail: string };
  lastScanTime: string | null;
  failedSourceCount: number;
}

export interface RadarPayload {
  generatedAt: string;
  signals: Signal[];
  status: SourceStatus[];
  themes: Theme[];
  regime: Regime;
  collisions: Collision[];
  systemStatus: SystemStatus;
}
