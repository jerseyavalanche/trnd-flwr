import type { SourceFeed } from "./types.js";

export type SourceParserType = "rss" | "webhook" | "http_json";

export type RealSourceStatus = "enabled" | "disabled" | "not_configured" | "auth_required";

export type RealSourceDefinition = {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  url: string;
  configuredFrom: SourceFeed["configuredFrom"];
  authRequired: boolean;
  parserType: SourceParserType;
  status: RealSourceStatus;
};

const parseFeedList = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((feed) => feed.trim())
    .filter(Boolean);

export const getConfiguredSourceFeeds = (): SourceFeed[] => [
  ...parseFeedList(process.env.TRND_FLWR_RSS_FEEDS).map((url) => ({
    url,
    sourceType: "rss" as const,
    configuredFrom: "TRND_FLWR_RSS_FEEDS" as const,
  })),
  ...parseFeedList(process.env.NEWS_RSS_FEEDS).map((url) => ({
    url,
    sourceType: "rss" as const,
    configuredFrom: "NEWS_RSS_FEEDS" as const,
  })),
];

export const getEnabledRealSources = (): RealSourceDefinition[] => {
  const feeds = getConfiguredSourceFeeds();
  if (feeds.length === 0) return [];

  return feeds.map((feed, index) => ({
    id: `rss_${index + 1}`,
    name: feed.url,
    category: "news",
    enabled: true,
    url: feed.url,
    configuredFrom: feed.configuredFrom,
    authRequired: false,
    parserType: "rss",
    status: "enabled",
  }));
};

export const getRegistryStatus = () => {
  const enabledSources = getEnabledRealSources();
  if (enabledSources.length === 0) {
    return {
      status: "not_configured" as const,
      message: "No real sources are configured yet. Set TRND_FLWR_RSS_FEEDS or NEWS_RSS_FEEDS.",
    };
  }

  return {
    status: "ok" as const,
    message: `${enabledSources.length} enabled source(s) configured.`,
  };
};
