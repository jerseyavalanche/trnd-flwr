import { createHash } from "node:crypto";
import type {
  IncomingSignalRecord,
  NormalizedSourceCategory,
  NormalizedSourceStatus,
  SignalImportance,
  SignalType,
  UiSourceCategory,
} from "./types.js";

export type PulledItem = {
  source: string;
  sourceCategory?: NormalizedSourceCategory | null;
  sourceStatus?: NormalizedSourceStatus | null;
  sourceUrl?: string | null;
  sourceDomain?: string | null;
  externalId?: string | null;
  title: string;
  summary?: string | null;
  imageUrl?: string | null;
  publishedAt?: string | null;
  category?: UiSourceCategory | null;
  signalType?: SignalType | null;
  importance?: SignalImportance | null;
  rawJson?: unknown;
  symbol?: string | null;
  assetClass?: string | null;
  direction?: string | null;
  confidence?: number | null;
  rawPayloadRef?: string | null;
  rawPayloadSummary?: string | null;
};

const canonicalizeUrl = (url?: string | null) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.searchParams.sort();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
};

export type SignalRecordCandidate = IncomingSignalRecord;

export const computeDedupeKey = (candidate: SignalRecordCandidate) =>
  createHash("sha256")
    .update(
      canonicalizeUrl(candidate.sourceUrl) ||
        [candidate.source, candidate.externalId ?? "", candidate.title, candidate.publishedAt ?? ""].join("|"),
    )
    .digest("hex");

export const normalizePulledItem = (item: PulledItem): SignalRecordCandidate => ({
  source: item.source,
  sourceCategory: item.sourceCategory ?? null,
  sourceStatus: item.sourceStatus ?? null,
  sourceUrl: item.sourceUrl ?? null,
  sourceDomain: item.sourceDomain ?? null,
  externalId: item.externalId ?? null,
  title: item.title,
  summary: item.summary ?? null,
  imageUrl: item.imageUrl ?? null,
  publishedAt: item.publishedAt ?? null,
  category: item.category ?? null,
  signalType: item.signalType ?? null,
  importance: item.importance ?? null,
  rawJson: item.rawJson,
  symbol: item.symbol ?? null,
  assetClass: item.assetClass ?? null,
  direction: item.direction ?? null,
  confidence: item.confidence ?? null,
  rawPayloadRef: item.rawPayloadRef ?? null,
  rawPayloadSummary: item.rawPayloadSummary ?? null,
});

export type PullSourceResult = {
  records: PulledItem[];
  errors: { source: string; message: string }[];
};

export type SourcePullConnector = {
  id: string;
  pullSource: () => Promise<PullSourceResult>;
};
