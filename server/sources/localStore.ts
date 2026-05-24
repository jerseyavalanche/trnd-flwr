import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { getDedupeKey } from "./dedupe.js";
import { DEFAULT_SIGNAL_PAGE_SIZE } from "./feedLimits.js";
import { capRaw } from "./normalize.js";
import { sourceRegistry } from "./sourceRegistry.js";
import type { IngestRunSummary, NormalizedIngestedItem, SourceStatus } from "./types.js";

type StoredItem = Record<string, unknown> & {
  id: string;
  ingestedAt: string;
  lastSeenAt: string;
  seenCount: number;
};

type LocalStore = {
  sources: Record<string, SourceStatus>;
  items: Record<string, StoredItem>;
  ingestRuns: Array<IngestRunSummary & { startedAt?: string; finishedAt?: string }>;
};

const storePath = resolve(process.cwd(), process.env.TRND_FLWR_LOCAL_STORE_PATH ?? ".trnd_flwr/local-store.json");

const baseSourceStatus = (source: (typeof sourceRegistry)[number]): SourceStatus => ({
  ...source,
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastError: null,
  latestItemCount: 0,
  totalItemCount: 0,
});

const emptyStore = (): LocalStore => ({
  sources: Object.fromEntries(sourceRegistry.map((source) => [source.id, baseSourceStatus(source)])),
  items: {},
  ingestRuns: [],
});

const readStore = async (): Promise<LocalStore> => {
  try {
    const raw = await readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<LocalStore>;
    return {
      ...emptyStore(),
      ...parsed,
      sources: {
        ...emptyStore().sources,
        ...(parsed.sources ?? {}),
      },
      items: parsed.items ?? {},
      ingestRuns: parsed.ingestRuns ?? [],
    };
  } catch {
    return emptyStore();
  }
};

const writeStore = async (store: LocalStore) => {
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, JSON.stringify(store));
};

const byIngestedDesc = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  new Date(String(b.ingestedAt)).getTime() - new Date(String(a.ingestedAt)).getTime();

const balanceBySource = <T extends Record<string, unknown>>(items: T[]) => {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const source = typeof item.source === "string" ? item.source : "unknown";
    groups.set(source, [...(groups.get(source) ?? []), item]);
  }

  const buckets = Array.from(groups.values())
    .map((group) => group.sort(byIngestedDesc))
    .sort((a, b) => byIngestedDesc(a[0] ?? {}, b[0] ?? {}));

  const balanced: T[] = [];
  while (buckets.some((bucket) => bucket.length > 0)) {
    for (const bucket of buckets) {
      const item = bucket.shift();
      if (item) balanced.push(item);
    }
  }
  return balanced;
};

export const getLocalSourceStatuses = async () => {
  const store = await readStore();
  return sourceRegistry.map((source) => {
    const stored = store.sources[source.id];
    const base = baseSourceStatus(source);
    return {
      ...(source.enabled ? base : stored),
      ...base,
      ...(source.enabled ? stored : {}),
      totalItemCount: Object.values(store.items).filter((item) => item.source === source.name || item.sourceId === source.id).length,
    };
  });
};

export const upsertLocalSourceStatus = async (status: SourceStatus) => {
  const store = await readStore();
  store.sources[status.id] = {
    ...status,
    totalItemCount: Object.values(store.items).filter((item) => item.source === status.name || item.sourceId === status.id).length,
  };
  await writeStore(store);
};

export const saveLocalItems = async (items: NormalizedIngestedItem[]) => {
  const store = await readStore();
  let inserted = 0;
  let updated = 0;

  for (const item of items) {
    const id = getDedupeKey(item);
    const existing = store.items[id];
    const payload = {
      id,
      source: item.source,
      sourceId: item.sourceId,
      sourceCategory: item.sourceCategory,
      sourceStatus: item.sourceStatus,
      externalId: item.externalId ?? null,
      title: item.title,
      summary: item.summary ?? null,
      url: item.url ?? null,
      imageUrl: item.imageUrl ?? null,
      symbol: item.symbol ?? null,
      assetClass: item.assetClass ?? "unknown",
      signalType: item.signalType,
      direction: item.direction ?? "unknown",
      confidence: item.confidence ?? null,
      importance: item.importance ?? "low",
      publishedAt: item.publishedAt ?? null,
      rawJson: capRaw(item.raw),
    };

    if (existing) {
      store.items[id] = {
        ...existing,
        ...payload,
        id,
        ingestedAt: existing.ingestedAt,
        lastSeenAt: item.ingestedAt,
        seenCount: existing.seenCount + 1,
      };
      updated += 1;
    } else {
      store.items[id] = {
        ...payload,
        id,
        ingestedAt: item.ingestedAt,
        lastSeenAt: item.ingestedAt,
        seenCount: 1,
      };
      inserted += 1;
    }
  }

  await writeStore(store);
  return { inserted, updated };
};

export const getLocalSignals = async (params: {
  category?: string;
  source?: string;
  q?: string;
  signalType?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) => {
  const store = await readStore();
  let items = Object.values(store.items);
  const query = params.q?.trim().toLowerCase();

  if (params.category) items = items.filter((item) => item.sourceCategory === params.category);
  if (params.source) items = items.filter((item) => item.source === params.source || item.sourceId === params.source);
  if (params.signalType) items = items.filter((item) => item.signalType === params.signalType);
  if (query) {
    items = items.filter((item) =>
      [item.title, item.summary, item.url, item.source, item.symbol].filter(Boolean).join(" ").toLowerCase().includes(query),
    );
  }

  if (params.sort === "published") {
    items.sort((a, b) => new Date(String(b.publishedAt ?? 0)).getTime() - new Date(String(a.publishedAt ?? 0)).getTime());
  } else if (params.sort === "confidence") {
    items.sort((a, b) => Number(b.confidence ?? 0) - Number(a.confidence ?? 0));
  } else {
    items = balanceBySource(items);
  }

  const offset = params.offset ?? 0;
  const limit = params.limit ?? DEFAULT_SIGNAL_PAGE_SIZE;
  return {
    items: items.slice(offset, offset + limit),
    total: items.length,
    offset,
    limit,
  };
};

export const recordLocalIngestRun = async (summary: IngestRunSummary, startedAt: string, finishedAt: string) => {
  const store = await readStore();
  store.ingestRuns.unshift({ ...summary, startedAt, finishedAt });
  store.ingestRuns = store.ingestRuns.slice(0, 50);
  await writeStore(store);
};
