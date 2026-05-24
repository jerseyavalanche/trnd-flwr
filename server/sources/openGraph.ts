import { canonicalizeUrl } from "./dedupe.js";
import { fetchText } from "./fetchHelpers.js";
import { truncate } from "./normalize.js";
import type { NormalizedIngestedItem } from "./types.js";

type OpenGraphMetadata = {
  title?: string;
  description?: string;
  image?: string;
  canonicalUrl?: string;
};

const cache = new Map<string, OpenGraphMetadata>();

const attr = (html: string, pattern: RegExp) => html.match(pattern)?.[1]?.trim();

export const extractOpenGraph = (html: string): OpenGraphMetadata => ({
  title: attr(html, /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i),
  description: attr(html, /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i),
  image: attr(html, /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
  canonicalUrl: attr(html, /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i),
});

const readOpenGraph = async (url: string) => {
  const key = canonicalizeUrl(url);
  if (!key) return {};
  const cached = cache.get(key);
  if (cached) return cached;

  const html = await fetchText(url, {}, 2_500);
  const metadata = extractOpenGraph(html);
  cache.set(key, metadata);
  return metadata;
};

export const enrichOpenGraph = async (items: NormalizedIngestedItem[]) => {
  const candidates = items.filter((item) => item.url && (!item.summary || !item.imageUrl)).slice(0, 12);
  const enrichments = await Promise.allSettled(candidates.map(async (item) => ({ item, metadata: await readOpenGraph(item.url ?? "") })));
  const byUrl = new Map<string, OpenGraphMetadata>();

  for (const enrichment of enrichments) {
    if (enrichment.status === "fulfilled" && enrichment.value.item.url) {
      byUrl.set(enrichment.value.item.url, enrichment.value.metadata);
    }
  }

  return items.map((item) => {
    if (!item.url) return item;
    const metadata = byUrl.get(item.url);
    if (!metadata) return item;
    return {
      ...item,
      summary: item.summary ?? truncate(metadata.description),
      imageUrl: item.imageUrl ?? metadata.image ?? null,
      url: metadata.canonicalUrl ?? item.url,
    };
  });
};
