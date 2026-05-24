import Parser from "rss-parser";
import type { IncomingSignalRecord, IngestError } from "./types.js";
import { getEnabledRealSources } from "./realSourceRegistry.js";
import {
  normalizePulledItem,
  type PullSourceResult,
  type PulledItem,
  type SourcePullConnector,
} from "./connectors.js";

type ConnectorResult = {
  records: IncomingSignalRecord[];
  errors: IngestError[];
};

export type SignalConnector = {
  id: string;
  fetchSignals: () => Promise<ConnectorResult>;
};

const parser = new Parser();

const hostFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const truncate = (value: string | undefined, maxLength = 280) => {
  if (!value) return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 3)}...` : trimmed;
};

const pullRssFeed = async (feedUrl: string): Promise<PullSourceResult> => {
  const records: PulledItem[] = [];
  const errors: PullSourceResult["errors"] = [];

  try {
    const feed = await parser.parseURL(feedUrl);
    const source = feed.title?.trim() || hostFromUrl(feedUrl);

    for (const item of feed.items ?? []) {
      if (!item.title && !item.link) continue;

      records.push({
        source,
        sourceUrl: item.link ?? null,
        title: item.title ?? item.link ?? "Untitled RSS item",
        summary: truncate(item.contentSnippet || item.summary || item.content),
        publishedAt: item.isoDate ?? item.pubDate ?? null,
        rawPayloadRef: feedUrl,
        rawPayloadSummary: truncate(
          JSON.stringify({
            creator: item.creator,
            categories: item.categories,
            guid: item.guid,
          }),
        ),
      });
    }
  } catch (error) {
    errors.push({
      source: feedUrl,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return { records, errors };
};

const buildConnector = (sourceId: string, feedUrl: string): SourcePullConnector => ({
  id: sourceId,
  pullSource: () => pullRssFeed(feedUrl),
});

export const getConfiguredPullConnectors = (): SourcePullConnector[] =>
  getEnabledRealSources()
    .filter((source) => source.enabled && source.parserType === "rss")
    .map((source) => buildConnector(source.id, source.url));

export const getConfiguredSignalConnectors = (): SignalConnector[] =>
  getConfiguredPullConnectors().map((connector) => ({
    id: connector.id,
    async fetchSignals() {
      const pulled = await connector.pullSource();
      return {
        records: pulled.records.map(normalizePulledItem),
        errors: pulled.errors,
      };
    },
  }));
