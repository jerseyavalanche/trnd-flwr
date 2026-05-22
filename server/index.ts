import express from 'express';
import cors from 'cors';
import { runIntelligence } from './intelligence.js';
import { loadSnapshot, saveSnapshot, storageStatus } from './store.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'trnd_flwr_backend', time: new Date().toISOString() });
});

app.get('/api/radar', async (_req, res) => {
  try {
    const payload = await runIntelligence();
    saveSnapshot(payload);
    res.json(payload);
  } catch {
    const cached = loadSnapshot();
    if (cached) return res.json(cached);
    res.status(503).json({ generatedAt: new Date().toISOString(), signals: [], status: [], themes: [], regime: { label: 'Unavailable', stability: 0, volatility: 0, emotionalTemperature: 0, fragmentation: 0 }, collisions: [], systemStatus: { backend: 'online', ingestion: 'degraded', storage: storageStatus(), modelSynthesis: { status: 'unavailable', detail: 'model synthesis unavailable' }, lastScanTime: null, failedSourceCount: 0 } });
  }
});

app.get('/api/status', async (_req, res) => {
  const payload = await runIntelligence();
  res.json(payload.systemStatus);
});

app.get('/api/sources/status', async (_req, res) => {
  const payload = await runIntelligence();
  res.json({ generatedAt: payload.generatedAt, status: payload.status });
});


app.get('/api/metrics', async (_req, res) => {
  const payload = await runIntelligence();
  res.json({
    generatedAt: payload.generatedAt,
    counters: {
      signals_total: payload.signals.length,
      sources_failed: payload.systemStatus.failedSourceCount,
      themes_total: payload.themes.length,
      collisions_total: payload.collisions.length
    },
    systemStatus: payload.systemStatus,
    sourceStatus: payload.status
  });
});

app.post('/api/ingest/webhook', async (_req, res) => {
  const payload = await runIntelligence();
  saveSnapshot(payload);
  res.json({ ok: true, trigger: 'webhook', generatedAt: payload.generatedAt, failedSourceCount: payload.systemStatus.failedSourceCount });
});

app.post('/api/ingest/n8n', async (_req, res) => {
  const payload = await runIntelligence();
  saveSnapshot(payload);
  res.json({ ok: true, trigger: 'n8n', generatedAt: payload.generatedAt, failedSourceCount: payload.systemStatus.failedSourceCount });
});

app.get('/api/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const emit = async () => {
    const payload = await runIntelligence();
    saveSnapshot(payload);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  await emit();
  const timer = setInterval(emit, 60000);
  req.on('close', () => clearInterval(timer));
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`TRND_FLWR backend on http://localhost:${port}`);
});
