import Parser from "rss-parser";
import { domainFromUrl, truncate, withIngestedAt } from "../normalize.js";
import type { NormalizedIngestedItem, SourceAdapter } from "../types.js";

type RssItem = Parser.Item & {
  contentEncoded?: string;
  enclosure?: { url?: string; type?: string };
  mediaContent?: Array<{ $?: { medium?: string; type?: string; url?: string } }>;
  mediaThumbnail?: Array<{ $?: { url?: string } }>;
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

const feeds = () =>
  [process.env.TRND_FLWR_RSS_FEEDS, process.env.NEWS_RSS_FEEDS]
    .filter(Boolean)
    .flatMap((value) => String(value).split(","))
    .map((value) => value.trim())
    .filter(Boolean);

const imageFromItem = (item: RssItem) => {
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

export const rssFeedsAdapter: SourceAdapter = {
  id: "rss_feeds",
  name: "RSS / Open Web Feeds",
  category: "news",
  url: "https://www.rssboard.org/rss-specification",
  enabledByDefault: true,
  requiresApiKey: false,
  paidRequired: false,
  connectionType: "public_api",
  docsUrl: "https://www.rssboard.org/rss-specification",
  async healthCheck() {
    return feeds().length > 0
      ? { ok: true, status: "connected" }
      : { ok: false, status: "disabled", message: "No TRND_FLWR_RSS_FEEDS or NEWS_RSS_FEEDS configured." };
  },
  async fetchLatest(): Promise<NormalizedIngestedItem[]> {
    const configuredFeeds = feeds();
    if (configuredFeeds.length === 0) return [];
    const parsedFeeds = await Promise.all(configuredFeeds.map(async (feedUrl) => ({ feedUrl, feed: await parser.parseURL(feedUrl) })));

    return parsedFeeds.flatMap(({ feedUrl, feed }) =>
      (feed.items ?? [])
        .filter((item) => item.title && item.link)
        .slice(0, 30)
        .map((item) => {
          const sourceDomain = domainFromUrl(item.link);
          return withIngestedAt({
            source: feed.title?.trim() || domainFromUrl(feedUrl) || "RSS Feed",
            sourceId: "rss_feeds",
            sourceCategory: "news",
            sourceStatus: "connected",
            externalId: item.guid ?? item.link,
            title: item.title ?? "",
            summary: truncate(item.contentSnippet || item.summary || item.content || item.contentEncoded),
            url: item.link,
            imageUrl: imageFromItem(item),
            assetClass: "unknown",
            signalType: "news",
            direction: "unknown",
            confidence: null,
            importance: "low",
            publishedAt: item.isoDate ?? item.pubDate ?? null,
            raw: { feedUrl, guid: item.guid, creator: item.creator, categories: item.categories, sourceDomain },
          });
        }),
    );
  },
};
