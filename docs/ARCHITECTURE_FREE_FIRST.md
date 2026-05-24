# TRND_FLWR Free-First Architecture

TRND_FLWR is local-first and free-infrastructure-first.

## Phase 1 layers
1. Ingestion layer (`server/adapters/*`) uses real public feeds/APIs only.
2. Normalization/scoring (`server/adapters/index.ts`) converts raw signals.
3. Memory layer (`server/store.ts`) writes JSON snapshots in `STORAGE_DIR`.
4. Synthesis layer (`server/intelligence.ts`) builds themes/collisions/regime.
5. UI layer (`src/*`) renders real status and unavailable states.

## Runtime topology
- React frontend (Vite)
- Express API backend
- SSE stream (`/api/stream`)
- Worker trigger script (`npm run worker:scan`)
- Local JSON fallback now, PostgreSQL-ready later via `DATABASE_URL`

## No-fake policy
- No mock data.
- If source fails, status is `unavailable`.
- If model config missing, show `model synthesis unavailable`.
