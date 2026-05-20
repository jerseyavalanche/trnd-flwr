import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { RadarPayload } from './types.js';

const storePath = process.env.RADAR_STORE_PATH || 'server/data/radar-cache.json';

export function saveSnapshot(payload: RadarPayload) {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(payload, null, 2));
}

export function loadSnapshot(): RadarPayload | null {
  if (!existsSync(storePath)) return null;
  return JSON.parse(readFileSync(storePath, 'utf-8')) as RadarPayload;
}
