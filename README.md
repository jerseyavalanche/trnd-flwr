# TRND_FLWR

TRND_FLWR is a civilization trend intelligence engine focused on real public signal ingestion, synthesis, and honest availability reporting.

## Mission
Track what humanity is collectively moving toward across technology, economics, markets, media, and behavior.

## Hard rules
- No mock data
- No fake prices
- No fake feeds
- No demo mode
- No paid-default infrastructure
- No paid-default model APIs
- Unavailable modules/sources must be shown honestly

## Free-first architecture (Oracle target)
Primary deployment target is Oracle Cloud Always Free Ampere A1 ARM VPS.

Phase 1 runs local-first and deploys later with Docker Compose.

Core stack:
- React + TypeScript + Tailwind frontend
- Node/Express backend + SSE
- real source adapters (RSS, GitHub, Reddit, market, FRED, GDELT)
- local JSON fallback + PostgreSQL-ready shape
- status + health + metrics endpoints

Self-hosted modules:
- Coolify (optional deployment manager)
- n8n (automation / ingestion workflows)
- Uptime Kuma (monitoring)
- Grafana OSS (observability)
- Postgres (memory moat)
- Redis (optional queue/cache)
- Caddy/Nginx (reverse proxy)

## Local run
```bash
cp .env.example .env
npm install
npm run local
```

## Validation commands
```bash
npm run lint
npm run healthcheck
npm run worker:scan
```

## Key API routes
- `GET /api/health`
- `GET /api/status`
- `GET /api/sources/status`
- `GET /api/metrics`
- `POST /api/ingest/webhook`
- `POST /api/ingest/n8n`

## Docs
- `docs/ARCHITECTURE_FREE_FIRST.md`
- `docs/FREE_SERVER_ARCHITECTURE.md`
- `docs/ORACLE_FREE_STACK.md`
- `docs/SELF_HOSTED_APPS.md`
- `docs/DEPLOYMENT_FREE.md`
- `docs/ORACLE_ALWAYS_FREE.md`
- `infra/README.md`
