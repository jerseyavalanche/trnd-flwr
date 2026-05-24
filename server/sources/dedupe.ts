import { createHash } from "node:crypto";
import type { NormalizedIngestedItem } from "./types.js";

export const canonicalizeUrl = (url?: string) => {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    parsed.searchParams.sort();
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url.trim();
  }
};

const timestampWindow = (value?: string | null) => {
  if (!value) return "";
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";
  return String(Math.floor(timestamp / 3_600_000));
};

export const getDedupeBasis = (item: NormalizedIngestedItem) => {
  if (item.externalId) return `external:${item.source}:${item.externalId}`;
  const canonicalUrl = canonicalizeUrl(item.url);
  if (canonicalUrl) return `url:${canonicalUrl}`;
  if (item.title && item.publishedAt) return `title:${item.source}:${item.title}:${item.publishedAt}`;
  return `event:${item.source}:${item.symbol ?? ""}:${item.signalType}:${timestampWindow(item.publishedAt)}`;
};

export const getDedupeKey = (item: NormalizedIngestedItem) =>
  createHash("sha256").update(getDedupeBasis(item)).digest("hex");
