import { domainFromUrl, withIngestedAt } from "../normalize.js";
import type { NormalizedIngestedItem, SourceAdapter } from "../types.js";

type HnItem = {
  id: number;
  type?: string;
  by?: string;
  time?: number;
  title?: string;
  url?: string;
  score?: number;
  descendants?: number;
};

const HN_BASE = "https://hacker-news.firebaseio.com/v0";
const HN_ITEM_URL = (id: number) => `https://news.ycombinator.com/item?id=${id}`;

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HN request failed: HTTP ${response.status}`);
  return (await response.json()) as T;
};

export const hackerNewsAdapter: SourceAdapter = {
  id: "hacker_news",
  name: "Hacker News",
  category: "social",
  url: "https://news.ycombinator.com/",
  enabledByDefault: true,
  requiresApiKey: false,
  paidRequired: false,
  connectionType: "public_api",
  docsUrl: "https://github.com/HackerNews/API",
  async healthCheck() {
    const response = await fetch(`${HN_BASE}/topstories.json`);
    return response.ok
      ? { ok: true, status: "connected" }
      : { ok: false, status: "error", message: `HTTP ${response.status}` };
  },
  async fetchLatest(): Promise<NormalizedIngestedItem[]> {
    const storyIdGroups = await Promise.all([
      fetchJson<number[]>(`${HN_BASE}/topstories.json`),
      fetchJson<number[]>(`${HN_BASE}/newstories.json`),
      fetchJson<number[]>(`${HN_BASE}/beststories.json`),
    ]);
    const ids = Array.from(new Set(storyIdGroups.flatMap((group) => group.slice(0, 25)))).slice(0, 60);
    const items = await Promise.all(ids.map((id) => fetchJson<HnItem | null>(`${HN_BASE}/item/${id}.json`)));

    return items
      .filter((item): item is HnItem => Boolean(item?.title) && item?.type === "story")
      .map((item) => {
        const url = item.url || HN_ITEM_URL(item.id);
        const domain = domainFromUrl(url);
        return withIngestedAt({
          source: "Hacker News",
          sourceId: "hacker_news",
          sourceCategory: "social",
          sourceStatus: "connected",
          externalId: String(item.id),
          title: item.title ?? "",
          summary: [
            domain ? `Domain: ${domain}` : null,
            item.by ? `Author: ${item.by}` : null,
            typeof item.score === "number" ? `Score: ${item.score}` : null,
            typeof item.descendants === "number" ? `Comments: ${item.descendants}` : null,
          ]
            .filter(Boolean)
            .join(" | "),
          url,
          imageUrl: null,
          assetClass: "unknown",
          signalType: "social_attention",
          direction: "unknown",
          confidence: typeof item.score === "number" ? Math.min(100, Math.round(item.score / 5)) : null,
          importance: item.score && item.score > 250 ? "high" : item.score && item.score > 75 ? "medium" : "low",
          publishedAt: item.time ? new Date(item.time * 1000).toISOString() : null,
          raw: { ...item, hnUrl: HN_ITEM_URL(item.id) },
        });
      });
  },
};
