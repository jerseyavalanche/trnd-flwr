import Parser from "rss-parser";
import type { IncomingSignalRecord, IngestError, NormalizedSourceCategory, UiSourceCategory } from "./types.js";
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

type RssItem = Parser.Item & {
  contentEncoded?: string;
  enclosure?: {
    url?: string;
    type?: string;
  };
  mediaContent?: Array<{
    $?: {
      medium?: string;
      type?: string;
      url?: string;
    };
  }>;
  mediaThumbnail?: Array<{
    $?: {
      url?: string;
    };
  }>;
};

const parser = new Parser<unknown, RssItem>({
  customFields: {
    item: [
      ["content:encoded", "contentEncoded"],
      ["media:content", "mediaContent", { keepArray: true }],
      ["media:thumbnail", "mediaThumbnail", { keepArray: true }],
    ],
  },
});

const hostFromUrl = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

const stripHtml = (value: string | undefined) => {
  if (!value) return null;
  const text = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0 ? text : null;
};

const truncate = (value: string | undefined, maxLength = 280) => {
  const trimmed = stripHtml(value);
  if (!trimmed) return null;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 3)}...` : trimmed;
};

const firstCategory = (item: RssItem) => item.categories?.find((category) => category.trim().length > 0);

const categorizeItem = (item: RssItem, domain: string): UiSourceCategory => {
  const haystack = [
    domain,
    item.title,
    item.contentSnippet,
    item.summary,
    item.content,
    item.contentEncoded,
    ...(item.categories ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (/(market|markets|stocks|equities|bonds|treasury|yields|nasdaq|dow jones|s&p|finance|earnings)/.test(haystack)) {
    return "market";
  }
  if (/(crypto|bitcoin|ethereum|solana|blockchain|defi|coinbase|binance)/.test(haystack)) {
    return "crypto";
  }
  if (/(artificial intelligence|\bai\b|machine learning|llm|openai|anthropic|model|neural)/.test(haystack)) {
    return "ai";
  }
  if (/(technology|software|developer|github|programming|security|infrastructure|cloud|hackernews|ycombinator)/.test(haystack)) {
    return "tech";
  }
  if (/(economy|economic|inflation|fed|federal reserve|gdp|jobs report|cpi|macro)/.test(haystack)) {
    return "economic";
  }
  if (/(reddit|social|tiktok|instagram|youtube|creator|community)/.test(haystack)) {
    return "social";
  }
  if (/(culture|film|music|gaming|esports|media|fashion|art)/.test(haystack)) {
    return "cultural";
  }
  if (/(prediction|polymarket|kalshi|metaculus|forecast)/.test(haystack)) {
    return "prediction";
  }

  return "other";
};

const normalizeSourceCategory = (category: UiSourceCategory): NormalizedSourceCategory => {
  if (category === "crypto") return "crypto";
  if (category === "market" || category === "economic") return "market";
  if (category === "social" || category === "cultural") return "social";
  if (category === "prediction") return "prediction";
  return "news";
};

const extractImageUrl = (item: RssItem) => {
  const mediaImage = item.mediaContent?.find((media) => {
    const type = media.$?.type ?? "";
    const medium = media.$?.medium ?? "";
    return Boolean(media.$?.url) && (medium === "image" || type.startsWith("image/"));
  })?.$?.url;
  const thumbnail = item.mediaThumbnail?.find((media) => Boolean(media.$?.url))?.$?.url;
  const enclosure = item.enclosure?.type?.startsWith("image/") ? item.enclosure.url : undefined;
  const html = item.contentEncoded || item.content || item.summary || "";
  const htmlImage = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];

  return mediaImage || thumbnail || enclosure || htmlImage || null;
};

const pullRssFeed = async (feedUrl: string): Promise<PullSourceResult> => {
  const records: PulledItem[] = [];
  const errors: PullSourceResult["errors"] = [];

  try {
    const feed = await parser.parseURL(feedUrl);
    const source = feed.title?.trim() || hostFromUrl(feedUrl);
    const sourceDomain = hostFromUrl(feedUrl);

    for (const item of feed.items ?? []) {
      if (!item.title || !item.link) continue;

      const category = categorizeItem(item, sourceDomain);

      records.push({
        source,
        sourceCategory: normalizeSourceCategory(category),
        sourceStatus: "connected",
        sourceUrl: item.link,
        sourceDomain: hostFromUrl(item.link) || sourceDomain,
        externalId: item.guid ?? item.link,
        title: item.title,
        summary: truncate(item.contentSnippet || item.summary || item.content || item.contentEncoded),
        imageUrl: extractImageUrl(item),
        publishedAt: item.isoDate ?? item.pubDate ?? null,
        category,
        assetClass: category === "crypto" ? "crypto" : category === "prediction" ? "event" : "unknown",
        direction: "unknown",
        signalType: category === "prediction" ? "prediction_market" : category === "social" ? "social_attention" : "news",
        importance: "low",
        rawPayloadRef: feedUrl,
        rawJson: {
          creator: item.creator,
          categories: item.categories,
          guid: item.guid,
          link: item.link,
          isoDate: item.isoDate,
          pubDate: item.pubDate,
        },
        rawPayloadSummary: truncate(
          JSON.stringify({
            creator: item.creator,
            categories: item.categories,
            guid: item.guid,
            sourceCategory: firstCategory(item),
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
