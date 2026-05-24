import { fetchJson } from "../fetchHelpers.js";
import { domainFromUrl, truncate, withIngestedAt } from "../normalize.js";
import type { NormalizedIngestedItem, SourceAdapter } from "../types.js";

type RedditChild = {
  data?: {
    id?: string;
    subreddit?: string;
    title?: string;
    url?: string;
    permalink?: string;
    score?: number;
    num_comments?: number;
    created_utc?: number;
    author?: string;
    selftext?: string;
    thumbnail?: string;
  };
};

type RedditResponse = {
  data?: {
    children?: RedditChild[];
  };
};

const subreddits = (process.env.TRND_FLWR_REDDIT_SUBREDDITS ?? "technology,stocks,investing,CryptoCurrency")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const redditAdapter: SourceAdapter = {
  id: "reddit",
  name: "Reddit",
  category: "social",
  url: "https://www.reddit.com/",
  enabledByDefault: false,
  requiresApiKey: false,
  paidRequired: false,
  connectionType: "public_api",
  docsUrl: "https://www.reddit.com/dev/api/",
  async healthCheck() {
    return { ok: false, status: "disabled", message: "Reddit public JSON is disabled by default because unauthenticated requests are routinely rejected." };
  },
  async fetchLatest(): Promise<NormalizedIngestedItem[]> {
    const responses = await Promise.all(
      subreddits.map(async (subreddit) => ({
        subreddit,
        payload: await fetchJson<RedditResponse>(`https://www.reddit.com/r/${subreddit}/hot.json?limit=20`, {
          headers: { "User-Agent": "TRND_FLWR/0.1 public-source-reader" },
        }).catch((error: unknown) => {
          throw new Error(`Reddit request failed: ${error instanceof Error ? error.message : String(error)}`);
        }),
      })),
    );

    return responses.flatMap(({ subreddit, payload }) =>
      (payload.data?.children ?? [])
        .map((child) => child.data)
        .filter((post): post is NonNullable<RedditChild["data"]> => Boolean(post?.id && post?.title))
        .map((post) => {
          const url = post.url || `https://www.reddit.com${post.permalink ?? ""}`;
          const thumbnail = post.thumbnail?.startsWith("http") ? post.thumbnail : null;
          return withIngestedAt({
            source: "Reddit",
            sourceId: "reddit",
            sourceCategory: "social",
            sourceStatus: "connected",
            externalId: post.id,
            title: post.title ?? "",
            summary: truncate(
              [
                `r/${subreddit}`,
                domainFromUrl(url) ? `Domain: ${domainFromUrl(url)}` : null,
                typeof post.score === "number" ? `Score: ${post.score}` : null,
                typeof post.num_comments === "number" ? `Comments: ${post.num_comments}` : null,
                post.selftext,
              ]
                .filter(Boolean)
                .join(" | "),
            ),
            url,
            imageUrl: thumbnail,
            assetClass: "unknown",
            signalType: "social_attention",
            direction: "unknown",
            confidence: typeof post.score === "number" ? Math.min(100, Math.round(post.score / 10)) : null,
            importance: post.score && post.score > 1000 ? "high" : post.score && post.score > 250 ? "medium" : "low",
            publishedAt: post.created_utc ? new Date(post.created_utc * 1000).toISOString() : null,
            raw: post,
          });
        }),
    );
  },
};
