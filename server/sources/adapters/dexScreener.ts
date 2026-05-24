import { fetchJson, fetchResponse } from "../fetchHelpers.js";
import { truncate, withIngestedAt } from "../normalize.js";
import type { NormalizedIngestedItem, SourceAdapter } from "../types.js";

type DexProfile = {
  url?: string;
  chainId?: string;
  tokenAddress?: string;
  amount?: number;
  totalAmount?: number;
  icon?: string;
  header?: string;
  description?: string;
  links?: unknown[];
};

const endpoints = [
  { label: "profile", url: "https://api.dexscreener.com/token-profiles/latest/v1" },
  { label: "boost_latest", url: "https://api.dexscreener.com/token-boosts/latest/v1" },
  { label: "boost_top", url: "https://api.dexscreener.com/token-boosts/top/v1" },
];

export const dexScreenerAdapter: SourceAdapter = {
  id: "dexscreener",
  name: "DexScreener",
  category: "crypto",
  url: "https://dexscreener.com/",
  enabledByDefault: true,
  requiresApiKey: false,
  paidRequired: false,
  connectionType: "public_api",
  docsUrl: "https://docs.dexscreener.com/api/reference",
  async healthCheck() {
    const response = await fetchResponse(endpoints[0].url);
    return response.ok
      ? { ok: true, status: "connected" }
      : { ok: false, status: response.status === 429 ? "rate_limited" : "error", message: `HTTP ${response.status}` };
  },
  async fetchLatest(): Promise<NormalizedIngestedItem[]> {
    const payloads = await Promise.all(
      endpoints.map(async (endpoint) => {
        const payload = await fetchJson<DexProfile[]>(endpoint.url).catch((error: unknown) => {
          throw new Error(`DexScreener ${endpoint.label} request failed: ${error instanceof Error ? error.message : String(error)}`);
        });
        return { label: endpoint.label, payload };
      }),
    );
    const seen = new Set<string>();

    return payloads
      .flatMap(({ label, payload }) => payload.map((profile) => ({ ...profile, label })))
      .filter((profile) => profile.url && profile.tokenAddress)
      .filter((profile) => {
        const key = `${profile.chainId}:${profile.tokenAddress}:${profile.label}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 40)
      .map((profile) =>
        withIngestedAt({
          source: "DexScreener",
          sourceId: "dexscreener",
          sourceCategory: "crypto",
          sourceStatus: "connected",
          externalId: `${profile.chainId ?? "unknown"}:${profile.tokenAddress}`,
          title: `${profile.chainId ?? "DEX"} ${profile.label} ${profile.tokenAddress}`,
          summary: truncate(
            [
              profile.description,
              profile.amount !== undefined ? `Boost amount: ${profile.amount}` : null,
              profile.totalAmount !== undefined ? `Total boost: ${profile.totalAmount}` : null,
            ]
              .filter(Boolean)
              .join(" | "),
          ),
          url: profile.url,
          imageUrl: profile.icon || profile.header || null,
          symbol: null,
          assetClass: "crypto",
          signalType: "dex_activity",
          direction: "unknown",
          confidence: null,
          importance: "low",
          publishedAt: null,
          raw: profile,
        }),
      );
  },
};
