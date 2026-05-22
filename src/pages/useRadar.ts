import { useEffect, useState } from 'react';
import type { RadarPayload } from '../types';
import { api } from '../lib/api';

const emptyPayload: RadarPayload = {
  generatedAt: new Date(0).toISOString(),
  signals: [],
  status: [],
  themes: [],
  regime: { label: 'Unavailable', stability: 0, volatility: 0, emotionalTemperature: 0, fragmentation: 0 },
  collisions: [],
  systemStatus: {
    backend: 'offline',
    ingestion: 'degraded',
    storage: { ok: false, path: 'unknown' },
    modelSynthesis: { status: 'unavailable', detail: 'model synthesis unavailable' },
    lastScanTime: null,
    failedSourceCount: 0
  }
};

export function useRadar() {
  const [data, setData] = useState<RadarPayload>(emptyPayload);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(api.radar).then((r) => r.json()).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
    const es = new EventSource(api.stream);
    es.onmessage = (evt) => { setData(JSON.parse(evt.data)); setLoading(false); };
    return () => es.close();
  }, []);

  return { data, loading };
}
