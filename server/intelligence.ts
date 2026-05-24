import type { Collision, RadarPayload, Regime, Signal, Theme } from './types.js';
import { ingestSignals } from './adapters/index.js';
import { storageStatus } from './store.js';

const THEME_KEYWORDS: Record<string, string[]> = {
  'AI Infrastructure': ['ai', 'infrastructure', 'automation'],
  'Grid Stress': ['grid', 'energy'],
  'Consumer Compression': ['consumer', 'housing'],
  'Defense Tech': ['defense'],
  'Loneliness Economy': ['loneliness'],
  'Search Fragmentation': ['search']
};

function buildThemes(signals: Signal[]): Theme[] { return Object.entries(THEME_KEYWORDS).map(([name, keys]) => { const hits = signals.filter((s) => s.tokens.some((t) => keys.includes(t))); const strength = hits.length ? Math.min(10, hits.reduce((a, s) => a + s.score, 0) / hits.length) : 0; return { name, strength: Number(strength.toFixed(2)), acceleration: Number(Math.min(10, hits.length * 1.7).toFixed(2)), confidence: Number(Math.min(10, hits.length * 2).toFixed(2)), emotionalIntensity: Number(Math.min(10, hits.filter((h) => h.source === 'reddit' || h.source === 'rss' || h.source === 'gdelt').length * 3 || hits.length).toFixed(2)), evidence: hits.slice(0, 3).map((h) => h.title), linkedSources: [...new Set(hits.map((h) => h.source))] }; }).filter((t) => t.evidence.length > 0).sort((a, b) => b.strength - a.strength); }

function buildCollisions(themes: Theme[]): Collision[] { const out: Collision[] = []; for (let i = 0; i < themes.length; i += 1) for (let j = i + 1; j < themes.length; j += 1) { const overlap = themes[i].linkedSources.filter((s) => themes[j].linkedSources.includes(s)).length; if (overlap > 0) out.push({ themes: [themes[i].name, themes[j].name], overlapSignals: overlap, score: Number(Math.min(10, (themes[i].strength + themes[j].strength) / 2 + overlap).toFixed(2)) }); } return out.sort((a, b) => b.score - a.score).slice(0, 6); }

function buildRegime(themes: Theme[], collisions: Collision[]): Regime { const avgStrength = themes.length ? themes.reduce((a, t) => a + t.strength, 0) / themes.length : 0; const volatility = themes.length ? themes.reduce((a, t) => a + t.acceleration, 0) / themes.length : 0; const fragmentation = Math.min(10, themes.length + collisions.length / 2); const emotionalTemperature = themes.length ? themes.reduce((a, t) => a + t.emotionalIntensity, 0) / themes.length : 0; const stability = Number((10 - Math.min(9, volatility / 1.5)).toFixed(2)); const label = volatility > 6 ? 'Automation Expansion' : avgStrength > 5 ? 'Institutional Distrust' : 'Risk-Off Drift'; return { label, stability, volatility: Number(volatility.toFixed(2)), emotionalTemperature: Number(emotionalTemperature.toFixed(2)), fragmentation: Number(fragmentation.toFixed(2)) }; }

export async function runIntelligence(): Promise<RadarPayload> {
  const { signals, status } = await ingestSignals();
  const themes = buildThemes(signals);
  const collisions = buildCollisions(themes);
  const regime = buildRegime(themes, collisions);
  const generatedAt = new Date().toISOString();
  const failedSourceCount = status.filter((s) => s.status === 'unavailable').length;
  const modelEnabled = process.env.ENABLE_OPENROUTER === 'true' || process.env.ENABLE_OLLAMA === 'true';
  const modelAvailable = (process.env.ENABLE_OPENROUTER === 'true' && !!process.env.OPENROUTER_API_KEY) || process.env.ENABLE_OLLAMA === 'true';
  return { generatedAt, signals, status, themes, regime, collisions, systemStatus: { backend: 'online', ingestion: failedSourceCount > 0 ? 'degraded' : 'ok', storage: storageStatus(), modelSynthesis: modelAvailable ? { status: 'available', detail: modelEnabled ? 'Model adapters enabled.' : 'N/A' } : { status: 'unavailable', detail: 'model synthesis unavailable' }, lastScanTime: generatedAt, failedSourceCount } };
}
