import { FieldValue } from "firebase-admin/firestore";
import { runFirestoreQuery } from "../firestoreAccess.js";
import { getDedupeKey } from "./dedupe.js";
import {
  getLocalSignals,
  getLocalSourceStatuses,
  recordLocalIngestRun,
  saveLocalItems,
  upsertLocalSourceStatus,
} from "./localStore.js";
import { DEFAULT_SIGNAL_PAGE_SIZE } from "./feedLimits.js";
import { capRaw } from "./normalize.js";
import { enrichOpenGraph } from "./openGraph.js";
import { getRunnableAdapters, publicAdapters, sourceRegistry } from "./sourceRegistry.js";
import type { IngestRunSummary, NormalizedIngestedItem, SourceAdapter, SourceStatus } from "./types.js";

const nowIso = () => new Date().toISOString();
const newRunId = () => `ingest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const baseStatus = (source: (typeof sourceRegistry)[number]): SourceStatus => ({
  ...source,
  lastAttemptAt: null,
  lastSuccessAt: null,
  lastError: null,
  latestItemCount: 0,
  totalItemCount: 0,
});

const statusFromAdapter = (adapter: SourceAdapter, status: SourceStatus["status"], error?: string, latestItemCount = 0): SourceStatus => ({
  id: adapter.id,
  name: adapter.name,
  category: adapter.category,
  url: adapter.url,
  enabled: adapter.enabledByDefault && status !== "disabled",
  status,
  connectionType: adapter.connectionType,
  docsUrl: adapter.docsUrl,
  needsApiKey: adapter.requiresApiKey,
  paidRequired: adapter.paidRequired,
  platformLimited: adapter.platformLimited,
  envVars: adapter.envVars,
  lastAttemptAt: nowIso(),
  lastSuccessAt: status === "connected" ? nowIso() : null,
  lastError: error ?? null,
  latestItemCount,
  totalItemCount: 0,
});

const statusFromMeta = (source: (typeof sourceRegistry)[number], status: SourceStatus["status"], error?: string): SourceStatus => ({
  ...baseStatus(source),
  status,
  lastAttemptAt: nowIso(),
  lastSuccessAt: status === "connected" ? nowIso() : null,
  lastError: error ?? null,
});

const hasRequiredEnvVars = (envVars?: string[]) => (envVars ?? []).every((envVar) => Boolean(process.env[envVar]));

const isFailureStatus = (status: SourceStatus["status"]) => status === "error" || status === "rate_limited";

const errorsBySource = (errors: IngestRunSummary["errors"]) =>
  Object.fromEntries(errors.map((error) => [error.source, error.message]));

const byIngestedDesc = (a: FirebaseFirestore.DocumentData, b: FirebaseFirestore.DocumentData) =>
  new Date(String(b.ingestedAt)).getTime() - new Date(String(a.ingestedAt)).getTime();

const balanceBySource = (items: FirebaseFirestore.DocumentData[]) => {
  const groups = new Map<string, FirebaseFirestore.DocumentData[]>();
  for (const item of items) {
    const source = typeof item.source === "string" ? item.source : "unknown";
    groups.set(source, [...(groups.get(source) ?? []), item]);
  }

  const buckets = Array.from(groups.values())
    .map((group) => group.sort(byIngestedDesc))
    .sort((a, b) => byIngestedDesc(a[0] ?? {}, b[0] ?? {}));

  const balanced: FirebaseFirestore.DocumentData[] = [];
  while (buckets.some((bucket) => bucket.length > 0)) {
    for (const bucket of buckets) {
      const item = bucket.shift();
      if (item) balanced.push(item);
    }
  }
  return balanced;
};

export const getSourceStatuses = async () => {
  const stored = await runFirestoreQuery(async (db) => {
    const snapshot = await db.collection("sources").get();
    const byId = new Map(snapshot.docs.map((doc) => [doc.id, doc.data() as Partial<SourceStatus>]));
    return sourceRegistry.map((source) => ({
      ...baseStatus(source),
      ...byId.get(source.id),
    }));
  });

  if (stored.ok) return { ok: true as const, sources: stored.value, storageError: null };

  const localSources = await getLocalSourceStatuses();
  return {
    ok: false as const,
    sources: localSources,
    storageError: stored.message,
  };
};

export const getSourceHealthSummary = async () => {
  const statuses = await getSourceStatuses();
  const sources = statuses.sources;
  const lastAttempts = sources.map((source) => source.lastAttemptAt).filter(Boolean).sort();
  const lastSuccesses = sources.map((source) => source.lastSuccessAt).filter(Boolean).sort();
  const lastAttemptAt = lastAttempts.length > 0 ? lastAttempts[lastAttempts.length - 1] : null;
  const lastSuccessAt = lastSuccesses.length > 0 ? lastSuccesses[lastSuccesses.length - 1] : null;
  const lastError = statuses.storageError ?? sources.find((source) => source.lastError)?.lastError ?? null;

  return {
    sources,
    summary: {
      configured: sources.length,
      enabled: sources.filter((source) => source.enabled).length,
      healthy: sources.filter((source) => source.status === "connected").length,
      failed: sources.filter((source) => source.status === "error" || source.status === "rate_limited").length,
      degraded: statuses.storageError ? 1 : sources.filter((source) => source.status !== "connected" && source.enabled).length,
      lastAttemptAt,
      lastSuccessAt,
      lastError,
      storageError: statuses.storageError,
    },
  };
};

const upsertSourceStatus = async (source: SourceStatus) =>
  runFirestoreQuery(async (db) => {
    await db.collection("sources").doc(source.id).set(
      {
        ...source,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

const upsertSourceStatusWithFallback = async (source: SourceStatus) => {
  const result = await upsertSourceStatus(source);
  if (!result.ok) await upsertLocalSourceStatus(source);
  return result;
};

const saveItems = async (items: NormalizedIngestedItem[]) =>
  runFirestoreQuery(async (db) => {
    let inserted = 0;
    let updated = 0;

    for (const item of items) {
      const id = getDedupeKey(item);
      const ref = db.collection("ingested_items").doc(id);
      await db.runTransaction(async (transaction) => {
        const existing = await transaction.get(ref);
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
          updatedAt: FieldValue.serverTimestamp(),
        };

        if (existing.exists) {
          const data = existing.data() ?? {};
          transaction.set(
            ref,
            {
              ...payload,
              ingestedAt: typeof data.ingestedAt === "string" ? data.ingestedAt : item.ingestedAt,
              lastSeenAt: item.ingestedAt,
              seenCount: (typeof data.seenCount === "number" ? data.seenCount : 1) + 1,
            },
            { merge: true },
          );
          updated += 1;
          return;
        }

        transaction.set(ref, {
          ...payload,
          ingestedAt: item.ingestedAt,
          lastSeenAt: item.ingestedAt,
          seenCount: 1,
          createdAt: FieldValue.serverTimestamp(),
        });
        inserted += 1;
      });
    }

    return { inserted, updated };
  });

export const getStoredSignals = async (params: {
  category?: string;
  source?: string;
  q?: string;
  signalType?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}) => {
  const stored = await runFirestoreQuery(async (db) => {
    const snapshot = await db.collection("ingested_items").orderBy("ingestedAt", "desc").limit(2000).get();
    let items = snapshot.docs.map((doc) => doc.data());
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
    } else if (params.sort === "importance") {
      const rank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      items.sort((a, b) => (rank[String(b.importance)] ?? 0) - (rank[String(a.importance)] ?? 0));
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
  });

  if (stored.ok) return stored;
  const localItems = await getLocalSignals(params);
  return { ok: true as const, value: localItems, storageError: stored.message };
};

export const runIngest = async (sourceId?: string): Promise<IngestRunSummary> => {
  const runId = newRunId();
  const startedAt = nowIso();
  const adapters = sourceId ? publicAdapters.filter((adapter) => adapter.id === sourceId) : getRunnableAdapters();
  const errors: IngestRunSummary["errors"] = [];
  let sourcesSucceeded = 0;
  let sourcesFailed = 0;
  let itemsFetched = 0;
  let itemsInserted = 0;
  let itemsUpdated = 0;
  let storageError: string | null = null;

  if (sourceId && adapters.length === 0) {
    const source = sourceRegistry.find((candidate) => candidate.id === sourceId);
    const status =
      !source
        ? "unavailable"
        : source.platformLimited
          ? "platform_limited"
          : source.paidRequired
            ? "paid_required"
            : source.needsApiKey && !hasRequiredEnvVars(source.envVars)
              ? source.status === "needs_oauth" ? "needs_oauth" : "needs_api_key"
              : "error";
    const message = source
      ? `Source is not runnable without configuration: ${source.name} (${status}).`
      : `Unknown source: ${sourceId}.`;
    if (source) await upsertSourceStatusWithFallback(statusFromMeta(source, status, message));
    const summary: IngestRunSummary = {
      runId,
      status: "empty",
      message,
      sourcesAttempted: source ? 1 : 0,
      sourcesSucceeded: 0,
      sourcesFailed: source && status === "error" ? 1 : 0,
      itemsFetched: 0,
      itemsInserted: 0,
      itemsUpdated: 0,
      errors: source && status === "error" ? [{ source: source.name, message, retrySafe: true }] : [],
      errorsBySource: source && status === "error" ? { [source.name]: message } : {},
    };
    await recordLocalIngestRun(summary, startedAt, nowIso());
    return summary;
  }

  for (const adapter of adapters) {
    try {
      if (adapter.requiresApiKey && !hasRequiredEnvVars(adapter.envVars)) {
        await upsertSourceStatusWithFallback(statusFromAdapter(adapter, adapter.connectionType === "oauth" ? "needs_oauth" : "needs_api_key", "Required API key env var is missing."));
        continue;
      }
      if (adapter.paidRequired) {
        await upsertSourceStatusWithFallback(statusFromAdapter(adapter, "paid_required", "Vendor access is not configured."));
        continue;
      }
      if (adapter.platformLimited) {
        await upsertSourceStatusWithFallback(statusFromAdapter(adapter, "platform_limited", "Platform-limited source is not configured."));
        continue;
      }

      const health = await adapter.healthCheck();
      if (!health.ok) {
        const message = health.message ?? `Source health check reported ${health.status}.`;
        await upsertSourceStatusWithFallback(statusFromAdapter(adapter, health.status, message));
        if (isFailureStatus(health.status)) {
          sourcesFailed += 1;
          errors.push({ source: adapter.name, message, retrySafe: true, credentialsMissing: false });
        }
        continue;
      }

      const items = await enrichOpenGraph(await adapter.fetchLatest());
      itemsFetched += items.length;
      sourcesSucceeded += 1;
      await upsertSourceStatusWithFallback(statusFromAdapter(adapter, "connected", undefined, items.length));

      if (items.length === 0) continue;

      const saveResult = await saveItems(items);
      if (!saveResult.ok) {
        storageError = saveResult.message;
        const localSave = await saveLocalItems(items);
        itemsInserted += localSave.inserted;
        itemsUpdated += localSave.updated;
      } else {
        itemsInserted += saveResult.value.inserted;
        itemsUpdated += saveResult.value.updated;
      }
    } catch (error) {
      sourcesFailed += 1;
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ source: adapter.name, message, retrySafe: true, credentialsMissing: false });
      await upsertSourceStatusWithFallback(statusFromAdapter(adapter, message.includes("429") ? "rate_limited" : "error", message));
    }
  }

  if (storageError) {
    const summary: IngestRunSummary = {
      runId,
      status: itemsFetched > 0 ? "partial" : "storage_error",
      message: `Ingest complete using local real-data fallback because Firestore is degraded. Inserted ${itemsInserted}, updated ${itemsUpdated}. Firestore: ${storageError}`,
      sourcesAttempted: adapters.length,
      sourcesSucceeded,
      sourcesFailed,
      itemsFetched,
      itemsInserted,
      itemsUpdated,
      errors: [...errors, { source: "firestore", message: storageError, retrySafe: true, credentialsMissing: true }],
      errorsBySource: errorsBySource([...errors, { source: "firestore", message: storageError, retrySafe: true, credentialsMissing: true }]),
    };
    await recordLocalIngestRun(summary, startedAt, nowIso());
    return summary;
  }

  const summary: IngestRunSummary = {
    runId,
    status: errors.length > 0 ? "partial" : itemsFetched > 0 ? "ok" : "empty",
    message: `Ingest complete. Inserted ${itemsInserted}, updated ${itemsUpdated}.`,
    sourcesAttempted: adapters.length,
    sourcesSucceeded,
    sourcesFailed,
    itemsFetched,
    itemsInserted,
    itemsUpdated,
    errors,
    errorsBySource: errorsBySource(errors),
  };

  await runFirestoreQuery(async (db) => {
    await db.collection("ingest_runs").add({
      ...summary,
      startedAt,
      finishedAt: nowIso(),
      errorsJson: errors,
      createdAt: FieldValue.serverTimestamp(),
    });
  });

  await recordLocalIngestRun(summary, startedAt, nowIso());

  return summary;
};
