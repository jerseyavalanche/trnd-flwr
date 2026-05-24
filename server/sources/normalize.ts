import type { NormalizedIngestedItem } from "./types.js";

export const domainFromUrl = (url?: string) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

export const truncate = (value: string | undefined | null, maxLength = 280) => {
  if (!value) return undefined;
  const text = value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return undefined;
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
};

export const capRaw = (raw: unknown, maxLength = 900): Record<string, unknown> | undefined => {
  if (raw === undefined || raw === null) return undefined;
  try {
    const serialized = JSON.stringify(raw);
    if (serialized.length <= maxLength) {
      return typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : { value: raw };
    }
    return { truncated: true, preview: serialized.slice(0, maxLength) };
  } catch {
    return undefined;
  }
};

export const withIngestedAt = (item: Omit<NormalizedIngestedItem, "ingestedAt" | "lastSeenAt" | "seenCount">): NormalizedIngestedItem => ({
  ...item,
  ingestedAt: new Date().toISOString(),
  lastSeenAt: new Date().toISOString(),
  seenCount: 1,
});
