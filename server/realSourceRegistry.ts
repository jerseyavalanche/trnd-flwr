export type SourceParserType = "rss" | "webhook" | "http_json";

export type RealSourceStatus = "enabled" | "disabled" | "not_configured" | "auth_required";

export type RealSourceDefinition = {
  id: string;
  name: string;
  category: string;
  enabled: boolean;
  url: string;
  authRequired: boolean;
  parserType: SourceParserType;
  status: RealSourceStatus;
};

const parseConfiguredFeeds = () =>
  (process.env.TRND_FLWR_RSS_FEEDS ?? process.env.NEWS_RSS_FEEDS ?? "")
    .split(",")
    .map((feed) => feed.trim())
    .filter(Boolean);

export const getEnabledRealSources = (): RealSourceDefinition[] => {
  const feeds = parseConfiguredFeeds();
  if (feeds.length === 0) return [];

  return feeds.map((feedUrl, index) => ({
    id: `rss_${index + 1}`,
    name: feedUrl,
    category: "news",
    enabled: true,
    url: feedUrl,
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
