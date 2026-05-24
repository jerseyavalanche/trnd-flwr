import { Router } from "express";
import { FieldValue } from "firebase-admin/firestore";
import { computeDedupeKey } from "../connectors.js";
import { runFirestoreQuery } from "../firestoreAccess.js";
import { getConfiguredSignalConnectors } from "../sourceConnectors.js";
import { getEnabledRealSources, getRegistryStatus } from "../realSourceRegistry.js";
import {
  IncomingSignalRecord,
  IngestError,
  IngestResult,
  PersistedSignalRecord,
  SignalItem,
  TrendInsightRecord,
  UiSourceStatus,
} from "../types.js";

const router = Router();

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

const toPersistedSignal = (record: IncomingSignalRecord): PersistedSignalRecord => {
  const dedupeKey = computeDedupeKey(record);
  const ingestedAt = new Date().toISOString();

  return {
    id: dedupeKey,
    symbol: record.symbol ?? null,
    assetClass: record.assetClass ?? null,
    direction: record.direction ?? null,
    confidence: record.confidence ?? null,
    source: record.source,
    sourceUrl: record.sourceUrl ?? null,
    title: record.title,
    summary: record.summary ?? null,
    publishedAt: record.publishedAt ?? null,
    ingestedAt,
    dedupeKey,
    rawPayloadRef: record.rawPayloadRef ?? null,
    rawPayloadSummary: record.rawPayloadSummary ?? null,
  };
};

const docToPersistedSignal = (id: string, data: FirebaseFirestore.DocumentData): PersistedSignalRecord => ({
  id: typeof data.id === "string" ? data.id : id,
  symbol: typeof data.symbol === "string" ? data.symbol : null,
  assetClass: typeof data.assetClass === "string" ? data.assetClass : null,
  direction: typeof data.direction === "string" ? data.direction : null,
  confidence: typeof data.confidence === "number" ? data.confidence : null,
  source: typeof data.source === "string" ? data.source : "unknown",
  sourceUrl: typeof data.sourceUrl === "string" ? data.sourceUrl : null,
  title: typeof data.title === "string" ? data.title : "Untitled signal",
  summary: typeof data.summary === "string" ? data.summary : null,
  publishedAt: toIsoString(data.publishedAt),
  ingestedAt: toIsoString(data.ingestedAt) ?? new Date(0).toISOString(),
  dedupeKey: typeof data.dedupeKey === "string" ? data.dedupeKey : id,
  rawPayloadRef: typeof data.rawPayloadRef === "string" ? data.rawPayloadRef : null,
  rawPayloadSummary: typeof data.rawPayloadSummary === "string" ? data.rawPayloadSummary : null,
});

const persistedSignalToFeedItem = (record: PersistedSignalRecord, index: number): SignalItem => ({
  ...record,
  displayNumber: index + 1,
  sourceId: slugify(record.source),
  sourceLabel: record.source.toUpperCase(),
  category: record.assetClass === "prediction" ? "prediction" : "news",
  group: "news_narrative",
  trustTier: 2,
  score: record.confidence ?? 0,
  url: record.sourceUrl ?? "",
  sourceUrl: record.sourceUrl,
  summary: record.summary ?? "No summary provided by source.",
  domain: toDomain(record.sourceUrl),
  publishedAt: record.publishedAt ?? record.ingestedAt,
  tags: [record.symbol, record.assetClass, record.direction, record.source]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toUpperCase()),
  rawType: "firestore:signal",
  isPrediction: record.assetClass === "prediction",
  isOfficial: false,
  isSocial: false,
  isSecurity: false,
  isMarketMoving: Boolean(record.symbol || record.direction),
});

const toUiSourceStatus = (): UiSourceStatus[] =>
  getEnabledRealSources().map((source) => ({
    id: source.id,
    label: source.name,
    group: "news_narrative",
    category: "news",
    trustTier: 2,
    status: source.enabled ? "planned" : "offline",
    count24h: 0,
    authRequired: source.authRequired,
    enabled: source.enabled,
    freshnessMinutes: 60,
    notes:
      source.status === "enabled"
        ? "Configured and enabled. Run ingest to pull real records."
        : "Source is disabled.",
  }));

const getLastPullAt = async (): Promise<string | null> => {
  const result = await runFirestoreQuery(async (db) => {
    const snapshot = await db
      .collection("ingest_runs")
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const data = snapshot.docs[0]?.data();
    return toIsoString(data?.createdAt) ?? toIsoString(data?.startedAt) ?? null;
  });

  return result.ok ? result.value : null;
};

const buildRegistryResponse = async () => {
  const registry = getRegistryStatus();
  const sources = toUiSourceStatus();
  const lastPullAt = await getLastPullAt();

  return {
    sources,
    items: sources,
    status: registry.status,
    message: registry.message,
    lastPullAt,
    healthy: 0,
    notConfigured: sources.length === 0 ? 1 : 0,
  };
};

const saveSignals = async (incomingRecords: IncomingSignalRecord[]) => {
  return runFirestoreQuery(async (db) => {
    const addedRecords: PersistedSignalRecord[] = [];
    let skippedDuplicateCount = 0;

    for (const incomingRecord of incomingRecords) {
      const record = toPersistedSignal(incomingRecord);
      const signalRef = db.collection("signals").doc(record.dedupeKey);

      const added = await db.runTransaction(async (transaction) => {
        const existing = await transaction.get(signalRef);
        if (existing.exists) return false;
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

    return { addedRecords, skippedDuplicateCount };
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
  const lane = typeof req.query.lane === "string" ? req.query.lane.toLowerCase() : "";

  const queryResult = await runFirestoreQuery(async (db) => {
    const snapshot = await db.collection("signals").orderBy("ingestedAt", "desc").limit(100).get();
    return snapshot.docs.map((doc) => docToPersistedSignal(doc.id, doc.data()));
  });

  if (!queryResult.ok) {
    res.json({
      items: [],
      status: "storage_error",
      message: queryResult.message,
    });
    return;
  }

  let items = queryResult.value.map(persistedSignalToFeedItem);

  if (lane) {
    items = items.filter(
      (signal) =>
        signal.category.toLowerCase() === lane ||
        signal.tags.some((tag) => tag.toLowerCase() === lane),
    );
  }

  res.json({
    items,
    status: items.length > 0 ? "ok" : "empty",
    message:
      items.length > 0
        ? `${items.length} persisted signal(s) loaded from Firestore.`
        : "No persisted signals yet. Configure sources and run ingest.",
  });
});

router.get("/signals/health", async (_req, res) => {
  res.json(await buildRegistryResponse());
});

router.get("/sources/status", async (_req, res) => {
  res.json(await buildRegistryResponse());
});

router.get("/sources/registry", async (_req, res) => {
  res.json(await buildRegistryResponse());
});

router.get("/source-health", async (_req, res) => {
  res.json(await buildRegistryResponse());
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

router.post("/ingest", async (_req, res) => {
  const connectors = getConfiguredSignalConnectors();

  if (connectors.length === 0) {
    const result: IngestResult = {
      addedCount: 0,
      skippedDuplicateCount: 0,
      records: [],
      errors: [],
    };

    await recordIngestRun({
      ...result,
      connectorIds: [],
      status: "not_configured",
      message: "No enabled real sources are configured yet.",
    });

    res.json({
      ...result,
      status: "not_configured",
      message: "No enabled real sources are configured yet.",
    });
    return;
  }

  const errors: IngestError[] = [];
  const fetchedRecords: IncomingSignalRecord[] = [];

  for (const connector of connectors) {
    const result = await connector.fetchSignals();
    fetchedRecords.push(...result.records);
    errors.push(...result.errors);
  }

  const saveResult = await saveSignals(fetchedRecords);

  if (!saveResult.ok) {
    const failedResult: IngestResult = {
      addedCount: 0,
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

    await recordIngestRun({
      ...failedResult,
      connectorIds: connectors.map((connector) => connector.id),
      fetchedCount: fetchedRecords.length,
      status: "storage_error",
      message: saveResult.message,
    });

    res.json({
      ...failedResult,
      status: "storage_error",
      message: saveResult.message,
    });
    return;
  }

  const result: IngestResult = {
    addedCount: saveResult.value.addedRecords.length,
    skippedDuplicateCount: saveResult.value.skippedDuplicateCount,
    records: saveResult.value.addedRecords,
    errors,
  };

  await recordIngestRun({
    ...result,
    connectorIds: connectors.map((connector) => connector.id),
    fetchedCount: fetchedRecords.length,
    status: result.addedCount > 0 ? "ok" : errors.length > 0 ? "error" : "empty",
    message:
      result.addedCount > 0
        ? `Added ${result.addedCount} new signal(s).`
        : "Pull completed with no new records.",
  });

  res.json({
    ...result,
    status: result.addedCount > 0 ? "ok" : errors.length > 0 ? "error" : "empty",
    message:
      result.addedCount > 0
        ? `Added ${result.addedCount} new signal(s).`
        : "Pull completed with no new records.",
  });
});

router.post("/trend-insights", async (req, res) => {
  const requestedIds: string[] = Array.isArray(req.body?.signalIds)
    ? req.body.signalIds.filter((id: unknown): id is string => typeof id === "string")
    : [];
  const signalIds = requestedIds.slice(0, 10);

  if (signalIds.length === 0) {
    res.status(400).json({
      error: "signalIds is required.",
      status: "error",
      message: "signalIds is required.",
    });
    return;
  }

  const loadResult = await runFirestoreQuery(async (db) => {
    const snapshots = await Promise.all(
      signalIds.map((id) => db.collection("signals").doc(id).get()),
    );

    return snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => docToPersistedSignal(snapshot.id, snapshot.data() ?? {}));
  });

  if (!loadResult.ok) {
    res.status(503).json({
      status: "storage_error",
      message: loadResult.message,
    });
    return;
  }

  const records = loadResult.value;

  if (records.length === 0) {
    res.status(404).json({
      status: "empty",
      message: "No persisted signals found for the requested IDs.",
    });
    return;
  }

  const symbols = Array.from(
    new Set(records.map((record) => record.symbol).filter((symbol): symbol is string => Boolean(symbol))),
  );
  const generatedText = [
    `Trend insight from ${records.length} persisted signal${records.length === 1 ? "" : "s"}.`,
    symbols.length > 0 ? `Symbols: ${symbols.join(", ")}.` : "No symbols were provided by the loaded sources.",
    ...records.map((record) => {
      const parts = [
        record.title,
        record.source ? `Source: ${record.source}` : null,
        record.publishedAt ? `Published: ${record.publishedAt}` : null,
        record.summary ? `Summary: ${record.summary}` : null,
        record.direction ? `Direction: ${record.direction}` : null,
        typeof record.confidence === "number" ? `Confidence: ${record.confidence}` : null,
      ].filter(Boolean);

      return `- ${parts.join(" | ")}`;
    }),
  ].join("\n");

  const insight: TrendInsightRecord = {
    signalIds: records.map((record) => record.id),
    generatedText,
    createdAt: new Date().toISOString(),
    sourceCount: new Set(records.map((record) => record.source)).size,
    symbols,
    userAction: "copyable_trend_insight",
  };

  const saveInsight = await runFirestoreQuery(async (db) => {
    const doc = await db.collection("trend_insights").add({
      ...insight,
      createdAtServer: FieldValue.serverTimestamp(),
    });
    return doc.id;
  });

  res.json({
    id: saveInsight.ok ? saveInsight.value : undefined,
    ...insight,
    status: saveInsight.ok ? "ok" : "storage_error",
    message: saveInsight.ok ? "Trend insight saved." : saveInsight.message,
  });
});

router.post("/signals/:id/send-to-relay", (req, res) => {
  const { id } = req.params;
  res.status(501).json({
    status: "not_configured",
    message: `Signal ${id} relay export is not configured.`,
  });
});

export default router;
