import { createHash } from "node:crypto";
import type { IncomingSignalRecord } from "./types.js";

export type PulledItem = {
  source: string;
  sourceUrl?: string | null;
  title: string;
  summary?: string | null;
  publishedAt?: string | null;
  symbol?: string | null;
  assetClass?: string | null;
  direction?: string | null;
  confidence?: number | null;
  rawPayloadRef?: string | null;
  rawPayloadSummary?: string | null;
};

export type SignalRecordCandidate = IncomingSignalRecord;

export const computeDedupeKey = (candidate: SignalRecordCandidate) =>
  createHash("sha256")
    .update(
      [
        candidate.source,
        candidate.sourceUrl ?? "",
        candidate.symbol ?? "",
        candidate.publishedAt ?? "",
      ].join("|"),
    )
    .digest("hex");

export const normalizePulledItem = (item: PulledItem): SignalRecordCandidate => ({
  source: item.source,
  sourceUrl: item.sourceUrl ?? null,
  title: item.title,
  summary: item.summary ?? null,
  publishedAt: item.publishedAt ?? null,
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
