import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import type { RadarPayload } from './types.js';

const storageDir = process.env.STORAGE_DIR || 'server/data';
const storePath = process.env.RADAR_STORE_PATH || join(storageDir, 'radar-cache.json');

export function saveSnapshot(payload: RadarPayload) {
  mkdirSync(dirname(storePath), { recursive: true });
  writeFileSync(storePath, JSON.stringify(payload, null, 2));
}

export function loadSnapshot(): RadarPayload | null {
  if (!existsSync(storePath)) return null;
  return JSON.parse(readFileSync(storePath, 'utf-8')) as RadarPayload;
}

export function storageStatus() {
  try {
    mkdirSync(storageDir, { recursive: true });
    return { ok: true, path: storageDir };
  } catch (error) {
    return { ok: false, path: storageDir, error: (error as Error).message };
  }
}
