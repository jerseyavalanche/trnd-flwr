import { truncate, withIngestedAt } from "../normalize.js";
import type { NormalizedIngestedItem, SourceAdapter } from "../types.js";

type GdeltArticle = {
  url?: string;
  title?: string;
  seendate?: string;
  socialimage?: string;
  sourcecountry?: string;
  domain?: string;
  language?: string;
};

type GdeltResponse = {
  articles?: GdeltArticle[];
};

const queryBuckets = [
  { label: "markets", query: "markets OR stocks OR earnings OR finance" },
  { label: "ai", query: 'AI OR "artificial intelligence" OR semiconductors OR Nvidia OR chips' },
  { label: "crypto", query: "crypto OR bitcoin OR ethereum OR solana" },
  { label: "macro", query: "inflation OR Federal Reserve OR rates OR macro" },
];

const gdeltUrl = (query: string) =>
  `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(`(${query})`)}&mode=ArtList&format=json&maxrecords=20&sort=HybridRel&timespan=24h`;

const parseSeenDate = (value?: string) => {
  if (!value || value.length < 14) return null;
  const iso = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T${value.slice(8, 10)}:${value.slice(10, 12)}:${value.slice(12, 14)}Z`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
};

export const gdeltAdapter: SourceAdapter = {
  id: "gdelt",
  name: "GDELT",
  category: "news",
  url: "https://www.gdeltproject.org/",
  enabledByDefault: true,
  requiresApiKey: false,
  paidRequired: false,
  connectionType: "public_api",
  docsUrl: "https://www.gdeltproject.org/",
  async healthCheck() {
    const response = await fetch(gdeltUrl(queryBuckets[0].query));
    return response.ok
      ? { ok: true, status: "connected" }
      : { ok: false, status: "error", message: `HTTP ${response.status}` };
  },
  async fetchLatest(): Promise<NormalizedIngestedItem[]> {
    const results = await Promise.allSettled(
      queryBuckets.map(async (bucket) => {
        const response = await fetch(gdeltUrl(bucket.query));
        if (!response.ok) throw new Error(`GDELT ${bucket.label} request failed: HTTP ${response.status}`);
        return { bucket: bucket.label, payload: (await response.json()) as GdeltResponse };
      }),
    );
    const responses = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    if (responses.length === 0) {
      const firstError = results.find((result) => result.status === "rejected");
      throw new Error(firstError?.status === "rejected" && firstError.reason instanceof Error ? firstError.reason.message : "GDELT request failed");
    }
    const seen = new Set<string>();

    return responses
      .flatMap(({ bucket, payload }) => (payload.articles ?? []).map((article) => ({ ...article, bucket })))
      .filter((article) => article.title && article.url)
      .filter((article) => {
        if (!article.url || seen.has(article.url)) return false;
        seen.add(article.url);
        return true;
      })
      .map((article) =>
        withIngestedAt({
          source: "GDELT",
          sourceId: "gdelt",
          sourceCategory: "news",
          sourceStatus: "connected",
          externalId: article.url,
          title: article.title ?? "",
          summary: truncate([`Query: ${article.bucket}`, article.domain, article.sourcecountry, article.language].filter(Boolean).join(" | ")),
          url: article.url,
          imageUrl: article.socialimage || null,
          assetClass: "unknown",
          signalType: "news",
          direction: "unknown",
          confidence: null,
          importance: "low",
          publishedAt: parseSeenDate(article.seendate),
          raw: article,
        }),
      );
  },
};
