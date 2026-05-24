import { Router } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { computeDedupeKey } from "../connectors.js";
import { runFirestoreQuery } from "../firestoreAccess.js";
import { getConfiguredSignalConnectors } from "../sourceConnectors.js";
import { getEnabledRealSources, getRegistryStatus } from "../realSourceRegistry.js";
import { getSourceHealthSummary, getSourceStatuses, getStoredSignals, runIngest } from "../sources/runIngest.js";
import type { SourceStatus as EngineSourceStatus } from "../sources/types.js";
import {
  IncomingSignalRecord,
  IngestError,
  IngestResult,
  PersistedSignalRecord,
  SignalItem,
  SignalImportance,
  SignalType,
  UiSourceStatus,
} from "../types.js";

const router = Router();

let sourceOnlyRecords: PersistedSignalRecord[] = [];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const toDomain = (url?: string | null) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const toFeedGroup = (category: SignalItem["category"]): SignalItem["group"] => {
  if (category === "market" || category === "economic" || category === "crypto" || category === "options") return "market_finance";
  if (category === "institutional" || category === "insider") return "official_reality";
  if (category === "copytrader") return "social_culture";
  if (category === "tech" || category === "ai") return "tech_ai";
  if (category === "social" || category === "cultural") return "social_culture";
  if (category === "prediction") return "prediction";
  return "news_narrative";
};

const toUiCategory = (category: string | undefined): SignalItem["category"] => {
  if (category === "crypto") return "crypto";
  if (category === "options") return "options";
  if (category === "market") return "market";
  if (category === "institutional") return "institutional";
  if (category === "insider") return "insider";
  if (category === "news") return "news";
  if (category === "social") return "social";
  if (category === "prediction") return "prediction";
  if (category === "copytrader") return "copytrader";
  if (category === "technology") return "tech";
  if (category === "culture") return "cultural";
  return "other";
};

const engineStatusToUi = (status: EngineSourceStatus): UiSourceStatus => {
  const category = toUiCategory(status.category);
  const connectionStatus =
    status.status === "connected"
      ? "live"
      : status.status === "needs_api_key" || status.status === "needs_oauth"
        ? "auth_needed"
        : status.status === "paid_required" || status.status === "platform_limited" || status.status === "unavailable" || status.status === "disabled"
          ? "offline"
          : status.status === "rate_limited"
            ? "limited"
            : "degraded";

  return {
    id: status.id,
    label: status.name,
    group: toFeedGroup(category),
    category,
    trustTier: status.connectionType === "public_api" ? 2 : 3,
    status: connectionStatus,
    count24h: status.latestItemCount,
    lastAttemptAt: status.lastAttemptAt ?? undefined,
    lastSuccessAt: status.lastSuccessAt ?? undefined,
    lastError: status.lastError ?? undefined,
    authRequired: status.needsApiKey,
    enabled: status.enabled,
    freshnessMinutes: status.connectionType === "public_api" ? 15 : 1440,
    notes: status.lastError ?? `${status.connectionType} / ${status.status}`,
  };
};

const engineItemToSignal = (item: FirebaseFirestore.DocumentData, index: number): SignalItem => {
  const category = toUiCategory(typeof item.sourceCategory === "string" ? item.sourceCategory : undefined);
  const source = typeof item.source === "string" ? item.source : "unknown";
  const url = typeof item.url === "string" ? item.url : "";

  return {
    id: typeof item.id === "string" ? item.id : `${source}-${index}`,
    displayNumber: index + 1,
    sourceId: typeof item.sourceId === "string" ? item.sourceId : slugify(source),
    sourceLabel: source.toUpperCase(),
    category,
    group: toFeedGroup(category),
    trustTier: 2,
    score: typeof item.confidence === "number" ? item.confidence : 0,
    title: typeof item.title === "string" ? item.title : "Untitled signal",
    url,
    summary: typeof item.summary === "string" ? item.summary : "No summary provided by source.",
    imageUrl: typeof item.imageUrl === "string" ? item.imageUrl : undefined,
    domain: toDomain(url),
    publishedAt: toIsoString(item.publishedAt) ?? toIsoString(item.ingestedAt) ?? new Date(0).toISOString(),
    ingestedAt: toIsoString(item.ingestedAt) ?? new Date(0).toISOString(),
    lastSeenAt: toIsoString(item.lastSeenAt),
    seenCount: typeof item.seenCount === "number" ? item.seenCount : 1,
    tags: [item.symbol, item.assetClass, item.signalType, source].filter((value): value is string => typeof value === "string"),
    rawType: "ingested_item",
    isPrediction: category === "prediction",
    isOfficial: category === "institutional" || category === "insider",
    isSocial: category === "social",
    isSecurity: false,
    isMarketMoving: category === "market" || category === "crypto" || category === "options",
    symbol: typeof item.symbol === "string" ? item.symbol : null,
    assetClass: typeof item.assetClass === "string" ? item.assetClass : null,
    direction: typeof item.direction === "string" ? item.direction : "unknown",
    confidence: typeof item.confidence === "number" ? item.confidence : null,
    signalType: toSignalType(item.signalType),
    importance: toSignalImportance(item.importance),
    sourceUrl: url,
    dedupeKey: typeof item.id === "string" ? item.id : undefined,
    rawPayloadRef: url,
    rawPayloadSummary: typeof item.rawJson === "string" ? item.rawJson : null,
  };
};

const toIsoString = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (
    typeof value === "object" &&
    "toDate" in value &&
    typeof value.toDate === "function"
  ) {
    return value.toDate().toISOString();
  }
  return null;
};

const toSignalType = (value: unknown): SignalType | null => {
  if (
    value === "news" ||
    value === "whale_move" ||
    value === "options_flow" ||
    value === "insider_trade" ||
    value === "institutional_filing" ||
    value === "social_attention" ||
    value === "prediction_market" ||
    value === "price_move" ||
    value === "dex_activity" ||
    value === "source_status" ||
    value === "trader_profile"
  ) {
    return value;
  }
  return null;
};

const toSignalImportance = (value: unknown): SignalImportance => {
  if (value === "urgent" || value === "high" || value === "medium" || value === "low") return value;
  return "low";
};

const toPersistedSignal = (record: IncomingSignalRecord): PersistedSignalRecord => {
  const dedupeKey = computeDedupeKey(record);
  const ingestedAt = new Date().toISOString();

  return {
    id: dedupeKey,
    symbol: record.symbol ?? null,
    assetClass: record.assetClass ?? record.category ?? null,
    direction: record.direction ?? null,
    confidence: record.confidence ?? null,
    source: record.source,
    sourceCategory: record.sourceCategory ?? null,
    sourceStatus: record.sourceStatus ?? null,
    sourceUrl: record.sourceUrl ?? null,
    sourceDomain: record.sourceDomain ?? toDomain(record.sourceUrl),
    externalId: record.externalId ?? null,
    title: record.title,
    summary: record.summary ?? null,
    imageUrl: record.imageUrl ?? null,
    signalType: record.signalType ?? null,
    importance: record.importance ?? "low",
    rawJson: record.rawJson,
    publishedAt: record.publishedAt ?? null,
    ingestedAt,
    lastSeenAt: ingestedAt,
    seenCount: 1,
    dedupeKey,
    rawPayloadRef: record.rawPayloadRef ?? null,
    rawPayloadSummary: record.rawPayloadSummary ?? null,
  };
};

const mergeSourceOnlyRecords = (records: PersistedSignalRecord[]) => {
  const byId = new Map<string, PersistedSignalRecord>();
  sourceOnlyRecords.forEach((record) => {
    byId.set(record.dedupeKey, record);
  });
  records.forEach((record) => {
    const existing = byId.get(record.dedupeKey);
    byId.set(record.dedupeKey, existing ? { ...existing, ...record, ingestedAt: existing.ingestedAt, seenCount: existing.seenCount + 1 } : record);
  });
  sourceOnlyRecords = Array.from(byId.values()).sort(
    (a, b) => new Date(b.ingestedAt).getTime() - new Date(a.ingestedAt).getTime(),
  );
};

const saveSignals = async (incomingRecords: IncomingSignalRecord[]) => {
  return runFirestoreQuery(async (db) => {
    const addedRecords: PersistedSignalRecord[] = [];
    let updatedCount = 0;
    let skippedDuplicateCount = 0;

    for (const incomingRecord of incomingRecords) {
      const record = toPersistedSignal(incomingRecord);
      const signalRef = db.collection("signals").doc(record.dedupeKey);

      const added = await db.runTransaction(async (transaction) => {
        const existing = await transaction.get(signalRef);
        if (existing.exists) {
          const existingData = existing.data() ?? {};
          transaction.set(
            signalRef,
            {
              ...record,
              ingestedAt: typeof existingData.ingestedAt === "string" ? existingData.ingestedAt : record.ingestedAt,
              lastSeenAt: record.lastSeenAt,
              seenCount: (typeof existingData.seenCount === "number" ? existingData.seenCount : 1) + 1,
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
          updatedCount += 1;
          return false;
        }
        transaction.set(signalRef, {
          ...record,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return true;
      });

      if (added) {
        addedRecords.push(record);
      } else {
        skippedDuplicateCount += 1;
      }
    }

    return { addedRecords, updatedCount, skippedDuplicateCount };
  });
};

const recordIngestRun = async (payload: Record<string, unknown>) => {
  await runFirestoreQuery(async (db) => {
    await db.collection("ingest_runs").add({
      ...payload,
      createdAt: FieldValue.serverTimestamp(),
    });
  });
};

router.get("/signals", async (req, res) => {
  const stored = await getStoredSignals({
    category: typeof req.query.category === "string" ? req.query.category : undefined,
    source: typeof req.query.source === "string" ? req.query.source : undefined,
    q: typeof req.query.q === "string" ? req.query.q : undefined,
    signalType: typeof req.query.signalType === "string" ? req.query.signalType : undefined,
    sort: typeof req.query.sort === "string" ? req.query.sort : undefined,
    limit: typeof req.query.limit === "string" ? Number(req.query.limit) : undefined,
    offset: typeof req.query.offset === "string" ? Number(req.query.offset) : undefined,
  });

  if (stored.ok) {
    const items = stored.value.items.map(engineItemToSignal);
    res.json({
      items,
      total: stored.value.total,
      offset: stored.value.offset,
      limit: stored.value.limit,
      hasMore: stored.value.offset + items.length < stored.value.total,
      status: "storageError" in stored ? "storage_error" : items.length > 0 ? "ok" : "empty",
      message:
        "storageError" in stored && items.length > 0
          ? `${items.length} local real-data fallback item(s) loaded. Firestore degraded: ${stored.storageError}`
          : items.length > 0
          ? `${items.length} ingested item(s) loaded.`
          : "No real signals have been ingested yet. Connect sources or click Ingest New Signals.",
    });
    return;
  }

  res.json({
    items: [],
    status: "storage_error",
    message: "Firestore credentials unavailable. Configure Firebase Admin credentials or run in local fallback-disabled mode.",
  });
});

router.get("/sources", async (_req, res) => {
  const result = await getSourceStatuses();
  res.json({
    sources: result.sources,
    status: result.ok ? "ok" : "storage_error",
    message: result.ok
      ? `${result.sources.length} source(s) loaded.`
      : `Source registry loaded without persisted health. ${result.storageError}`,
  });
});

router.get("/sources/health", async (_req, res) => {
  const result = await getSourceHealthSummary();
  const uiSources = result.sources.map(engineStatusToUi);
  res.json({
    ...result.summary,
    sources: uiSources,
    items: uiSources,
    status: result.summary.storageError ? "storage_error" : "ok",
    message: result.summary.storageError
      ? `Firestore degraded: ${result.summary.storageError}`
      : `${result.summary.healthy}/${result.summary.enabled} enabled source(s) connected.`,
    lastPullAt: result.summary.lastSuccessAt,
    notConfigured: result.summary.enabled === 0 ? 1 : 0,
    lastError: result.summary.lastError,
    credentialsMode: result.summary.storageError ? "firestore_degraded" : "firestore_connected",
    credentialsMessage: result.summary.storageError
      ? `Firestore credentials unavailable. Configure Firebase Admin credentials or run in local fallback-disabled mode. ${result.summary.storageError}`
      : "Firestore connected.",
  });
});

router.get("/signals/health", async (_req, res) => {
  const result = await getSourceHealthSummary();
  const uiSources = result.sources.map(engineStatusToUi);
  res.json({ ...result.summary, sources: uiSources, items: uiSources, lastPullAt: result.summary.lastSuccessAt });
});

router.get("/sources/status", async (_req, res) => {
  const result = await getSourceHealthSummary();
  const uiSources = result.sources.map(engineStatusToUi);
  res.json({ ...result.summary, sources: uiSources, items: uiSources, lastPullAt: result.summary.lastSuccessAt });
});

router.get("/sources/registry", async (_req, res) => {
  const result = await getSourceHealthSummary();
  const uiSources = result.sources.map(engineStatusToUi);
  res.json({
    ...result.summary,
    sources: uiSources,
    items: uiSources,
    status: result.summary.storageError ? "storage_error" : "ok",
    message: result.summary.storageError ? `Firestore degraded: ${result.summary.storageError}` : "Source registry loaded.",
    lastPullAt: result.summary.lastSuccessAt,
    notConfigured: result.summary.enabled === 0 ? 1 : 0,
    lastError: result.summary.lastError,
    credentialsMode: result.summary.storageError ? "firestore_degraded" : "firestore_connected",
    credentialsMessage: result.summary.storageError
      ? `Firestore credentials unavailable. Configure Firebase Admin credentials or run in local fallback-disabled mode. ${result.summary.storageError}`
      : "Firestore connected.",
  });
});

router.get("/source-health", async (_req, res) => {
  const result = await getSourceHealthSummary();
  const uiSources = result.sources.map(engineStatusToUi);
  res.json({ ...result.summary, sources: uiSources, items: uiSources, lastPullAt: result.summary.lastSuccessAt });
});

router.get("/signals/sources", (_req, res) => {
  const registry = getRegistryStatus();
  const sources = getEnabledRealSources();

  res.json({
    sources,
    items: sources,
    status: registry.status,
    message: registry.message,
  });
});

router.post("/ingest/run", async (_req, res) => {
  res.json(await runIngest());
});

router.post("/ingest/source/:sourceId", async (req, res) => {
  res.json(await runIngest(req.params.sourceId));
});

const pullConfiguredSources = async () => {
  const connectors = getConfiguredSignalConnectors();

  if (connectors.length === 0) {
    const result: IngestResult = {
      addedCount: 0,
      updatedCount: 0,
      skippedDuplicateCount: 0,
      records: [],
      errors: [],
    };

    void recordIngestRun({
      ...result,
      connectorIds: [],
      status: "not_configured",
      message: "Set TRND_FLWR_RSS_FEEDS or NEWS_RSS_FEEDS.",
    });

    return {
      ...result,
      ok: false,
      reason: "NO_SOURCES_CONFIGURED",
      status: "not_configured",
      message: "Set TRND_FLWR_RSS_FEEDS or NEWS_RSS_FEEDS.",
    };
  }

  const errors: IngestError[] = [];
  const fetchedRecords: IncomingSignalRecord[] = [];

  for (const connector of connectors) {
    const result = await connector.fetchSignals();
    fetchedRecords.push(...result.records);
    errors.push(...result.errors);
  }

  const pulledRecords = fetchedRecords.map(toPersistedSignal);
  mergeSourceOnlyRecords(pulledRecords);

  const saveResult = await saveSignals(fetchedRecords);

  if (!saveResult.ok) {
    const failedResult: IngestResult = {
      addedCount: 0,
      updatedCount: 0,
      skippedDuplicateCount: 0,
      records: [],
      errors: [
        ...errors,
        {
          source: "firestore",
          message: saveResult.message,
        },
      ],
    };

    void recordIngestRun({
      ...failedResult,
      connectorIds: connectors.map((connector) => connector.id),
      fetchedCount: fetchedRecords.length,
      status: "storage_error",
      message: saveResult.message,
    });

    return {
      ...failedResult,
      records: pulledRecords,
      ok: false,
      status: "storage_error",
      message: `${saveResult.message} Live pull results are available in source-only mode for this session.`,
    };
  }

  const result: IngestResult = {
    addedCount: saveResult.value.addedRecords.length,
    updatedCount: saveResult.value.updatedCount,
    skippedDuplicateCount: saveResult.value.skippedDuplicateCount,
    records: saveResult.value.addedRecords,
    errors,
  };

  void recordIngestRun({
    ...result,
    connectorIds: connectors.map((connector) => connector.id),
    fetchedCount: fetchedRecords.length,
    status: result.addedCount > 0 ? "ok" : errors.length > 0 ? "error" : "empty",
    message:
      result.addedCount > 0 || result.updatedCount > 0
        ? `Added ${result.addedCount} new signal(s), updated ${result.updatedCount} existing signal(s).`
        : "Pull completed with no new records.",
  });

  return {
    ...result,
    ok: true,
    status: result.addedCount > 0 ? "ok" : errors.length > 0 ? "error" : "empty",
    message:
      result.addedCount > 0 || result.updatedCount > 0
        ? `Added ${result.addedCount} new signal(s), updated ${result.updatedCount} existing signal(s).`
        : "Pull completed with no new records.",
  };
};

router.post("/ingest", async (_req, res) => {
  res.json(await pullConfiguredSources());
});

router.post("/sources/pull", async (_req, res) => {
  res.json(await pullConfiguredSources());
});

router.post("/signals/:id/send-to-relay", (req, res) => {
  const { id } = req.params;
  res.status(501).json({
    status: "not_configured",
    message: `Signal ${id} relay export is not configured.`,
  });
});

export default router;
