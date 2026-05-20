import express from 'express';
import cors from 'cors';
import { runIntelligence } from './intelligence.js';
import { loadSnapshot, saveSnapshot } from './store.js';

const app = express();
app.use(cors());

app.get('/api/radar', async (_, res) => {
  try {
    const payload = await runIntelligence();
    saveSnapshot(payload);
    res.json(payload);
  } catch {
    const cached = loadSnapshot();
    if (cached) return res.json(cached);
    res.status(503).json({ generatedAt: new Date().toISOString(), signals: [], status: [] });
  }
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

app.listen(4000, () => {
  console.log('TRND_FLWR backend on http://localhost:4000');
});
