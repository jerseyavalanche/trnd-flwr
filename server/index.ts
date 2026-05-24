import express from "express";
import type { ErrorRequestHandler } from "express";
import cors from "cors";
import dotenv from "dotenv";
import signalLanesRouter from "./routes/signal-lanes.js";
import { getConfiguredSignalConnectors } from "./sourceConnectors.js";
import { getRegistryStatus } from "./realSourceRegistry.js";
import { getMarketQuotes } from "./marketQuotes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", signalLanesRouter);

const PORT = Number(process.env.PORT ?? 4000);

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "TRND_FLWR",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/status", (_req, res) => {
  const connectors = getConfiguredSignalConnectors();
  const registry = getRegistryStatus();

  res.json({
    ingestionStatus: registry.status,
    configuredSources: connectors.map((connector) => connector.id),
    okSources: connectors.length,
    degradedSources: connectors.length === 0 ? 1 : 0,
    errorSources: 0,
    disabledSources: 0,
    totalSignals: null,
    message: registry.message,
    lastScanAt: new Date().toISOString(),
  });
});

app.get("/api/radar", (_req, res) => {
  res.json({
    themes: [],
    signals: [],
    items: [],
    status: "empty",
    message: "Radar is not configured yet.",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/metrics", (_req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

app.get("/api/market/quotes", async (_req, res, next) => {
  try {
    res.json(await getMarketQuotes());
  } catch (error) {
    next(error);
  }
});

app.get("/api/stream", (_req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const interval = setInterval(() => {
    res.write(
      `data: ${JSON.stringify({
        heartbeat: true,
        time: new Date().toISOString(),
      })}\n\n`
    );
  }, 5000);

  _req.on("close", () => {
    clearInterval(interval);
  });
});

app.post("/api/ingest/webhook", (req, res) => {
  res.json({
    received: true,
    payload: req.body,
    status: "ok",
    message: "Webhook payload received.",
  });
});

app.post("/api/ingest/n8n", (req, res) => {
  res.json({
    received: true,
    payload: req.body,
    status: "ok",
    message: "n8n payload received.",
  });
});

app.use("/api", (req, res) => {
  res.status(404).json({
    status: "error",
    message: "API route not found",
    path: req.originalUrl,
  });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  void next;
  res.status(500).json({
    status: "error",
    message: error instanceof Error ? error.message : "Unexpected server error",
    error: error instanceof Error ? error.message : "Unexpected server error",
  });
};

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`TRND_FLWR backend running on :${PORT}`);
});
