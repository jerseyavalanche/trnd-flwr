import { fetchJson, fetchResponse } from "../fetchHelpers.js";
import { capRaw, truncate, withIngestedAt } from "../normalize.js";
import type { NormalizedIngestedItem, SourceAdapter } from "../types.js";

type PolymarketMarket = {
  id?: string;
  conditionId?: string;
  question?: string;
  slug?: string;
  description?: string;
  active?: boolean;
  closed?: boolean;
  volume?: string | number;
  liquidity?: string | number;
  image?: string;
  icon?: string;
  endDate?: string;
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  groupItemTitle?: string;
};

type PolymarketEvent = {
  id?: string;
  title?: string;
  slug?: string;
  description?: string;
  volume?: string | number;
  liquidity?: string | number;
  endDate?: string;
  tags?: Array<{ label?: string; slug?: string }>;
  category?: string;
  markets?: PolymarketMarket[];
};

const POLYMARKET_URL = "https://gamma-api.polymarket.com/events?active=true&closed=false&limit=12";

const parseMaybeJsonArray = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
};

export const polymarketAdapter: SourceAdapter = {
  id: "polymarket",
  name: "Polymarket",
  category: "prediction",
  url: "https://polymarket.com/",
  enabledByDefault: true,
  requiresApiKey: false,
  paidRequired: false,
  connectionType: "public_api",
  docsUrl: "https://docs.polymarket.com/",
  async healthCheck() {
    const response = await fetchResponse(POLYMARKET_URL);
    return response.ok
      ? { ok: true, status: "connected" }
      : { ok: false, status: response.status === 429 ? "rate_limited" : "error", message: `HTTP ${response.status}` };
  },
  async fetchLatest(): Promise<NormalizedIngestedItem[]> {
    const payload = await fetchJson<PolymarketEvent[]>(POLYMARKET_URL).catch((error: unknown) => {
      throw new Error(`Polymarket request failed: ${error instanceof Error ? error.message : String(error)}`);
    });

    return payload
      .slice(0, 12)
      .flatMap((event) =>
        (event.markets && event.markets.length > 0 ? event.markets.slice(0, 3) : [{ question: event.title, slug: event.slug, description: event.description, volume: event.volume, liquidity: event.liquidity, endDate: event.endDate }]).map((market) => ({ event, market })),
      )
      .filter(({ market }) => market.question && market.slug)
      .slice(0, 36)
      .map(({ event, market }) => {
        const outcomes = parseMaybeJsonArray(market.outcomes);
        const prices = parseMaybeJsonArray(market.outcomePrices);
        return (
        withIngestedAt({
          source: "Polymarket",
          sourceId: "polymarket",
          sourceCategory: "prediction",
          sourceStatus: "connected",
          externalId: market.conditionId ?? market.id ?? market.slug,
          title: market.question ?? market.groupItemTitle ?? event.title ?? "",
          summary: truncate(
            [
              event.title && event.title !== market.question ? `Event: ${event.title}` : null,
              market.description,
              outcomes.length > 0 ? `Outcomes: ${outcomes.join(", ")}` : null,
              prices.length > 0 ? `Prices: ${prices.join(", ")}` : null,
              market.volume !== undefined ? `Volume: ${market.volume}` : null,
              market.liquidity !== undefined ? `Liquidity: ${market.liquidity}` : null,
              event.category ? `Category: ${event.category}` : null,
            ]
              .filter(Boolean)
              .join(" | "),
          ),
          url: `https://polymarket.com/event/${market.slug}`,
          imageUrl: market.image || market.icon || null,
          assetClass: "event",
          signalType: "prediction_market",
          direction: "unknown",
          confidence: null,
          importance: Number(market.volume ?? 0) > 100_000 ? "medium" : "low",
          publishedAt: market.endDate ?? null,
          raw: capRaw({
            eventId: event.id,
            eventSlug: event.slug,
            marketId: market.id,
            conditionId: market.conditionId,
            slug: market.slug,
          }),
        })
        );
      });
  },
};
