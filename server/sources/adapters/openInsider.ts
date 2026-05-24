import { truncate, withIngestedAt } from "../normalize.js";
import type { NormalizedIngestedItem, SourceAdapter } from "../types.js";

const OPEN_INSIDER_URL = "http://openinsider.com/latest-insider-trading";

const strip = (value: string) =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

const cellsFromRow = (row: string) => [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => strip(match[1] ?? ""));

const firstHref = (row: string) => row.match(/href=["']([^"']+)["']/i)?.[1];

export const openInsiderAdapter: SourceAdapter = {
  id: "openinsider",
  name: "OpenInsider",
  category: "institutional",
  url: "http://openinsider.com/",
  enabledByDefault: true,
  requiresApiKey: false,
  paidRequired: false,
  connectionType: "scrape_possible",
  docsUrl: "http://openinsider.com/",
  async healthCheck() {
    const response = await fetch(OPEN_INSIDER_URL);
    return response.ok
      ? { ok: true, status: "connected" }
      : { ok: false, status: "error", message: `HTTP ${response.status}` };
  },
  async fetchLatest(): Promise<NormalizedIngestedItem[]> {
    const response = await fetch(OPEN_INSIDER_URL);
    if (!response.ok) throw new Error(`OpenInsider request failed: HTTP ${response.status}`);
    const html = await response.text();
    const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map((match) => match[1] ?? "");

    return rows
      .map((row) => ({ row, cells: cellsFromRow(row), href: firstHref(row) }))
      .filter(({ cells }) => cells.length >= 10)
      .slice(0, 50)
      .map(({ row, cells, href }) => {
        const tradeDate = cells[1];
        const ticker = cells[3];
        const company = cells[4];
        const insider = cells[5];
        const title = cells[6];
        const tradeType = cells[7];
        const price = cells[8];
        const value = cells[12] ?? cells[11];
        const sourceUrl = href?.startsWith("http") ? href : href ? `http://openinsider.com/${href.replace(/^\//, "")}` : OPEN_INSIDER_URL;

        return withIngestedAt({
          source: "OpenInsider",
          sourceId: "openinsider",
          sourceCategory: "institutional",
          sourceStatus: "connected",
          externalId: `${ticker}:${insider}:${tradeDate}:${tradeType}:${value}`,
          title: `${ticker} insider ${tradeType} - ${insider}`,
          summary: truncate([company, title, price ? `Price: ${price}` : null, value ? `Value: ${value}` : null].filter(Boolean).join(" | ")),
          url: sourceUrl,
          imageUrl: null,
          symbol: ticker || null,
          assetClass: "stock",
          signalType: "insider_trade",
          direction: /buy|purchase/i.test(tradeType) ? "bullish" : /sale|sell/i.test(tradeType) ? "bearish" : "unknown",
          confidence: null,
          importance: "medium",
          publishedAt: tradeDate ? `${tradeDate}T00:00:00Z` : null,
          raw: { cells, row },
        });
      });
  },
};
