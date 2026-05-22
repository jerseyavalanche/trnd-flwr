# Free Deployment Path (Phase 1)

## Local first
1. `cp .env.example .env`
2. `npm install`
3. `npm run local`
4. Optional checks: `npm run healthcheck`, `npm run worker:scan`

## Free VPS target
Deploy later to an Oracle Cloud Always Free ARM VM (Ubuntu aarch64).

## Minimal production layout
- `npm run build`
- serve frontend static files
- run backend `node dist-server/index.js`
- run scan scheduler with cron: `*/5 * * * * cd /app && npm run worker:scan`
- persist `STORAGE_DIR` on disk (e.g. `/var/lib/trnd-flwr`)

## Optional components (later)
- PostgreSQL/Supabase via `DATABASE_URL`
- reverse proxy (Caddy/Nginx)
