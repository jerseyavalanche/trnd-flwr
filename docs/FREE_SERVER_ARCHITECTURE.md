# TRND_FLWR Free Server Architecture (Phase 1)

## Phase 1 scope
- Frontend + backend run locally first
- Real adapters only (no mock data)
- Status/health/metrics endpoints
- Ingestion worker scaffold + n8n webhook placeholder
- PostgreSQL-ready structure with local JSON fallback

## Service routing target
- `/` -> TRND_FLWR frontend
- `/api` -> TRND_FLWR backend
- `/n8n` -> n8n
- `/status` -> Uptime Kuma
- `/grafana` -> Grafana

## Required vs optional
Required now:
- frontend, backend, source status endpoints
Optional now (scaffolded):
- postgres, redis, n8n, grafana, uptime-kuma, coolify

If optional module is missing/unconfigured, API/UI must show `unavailable` honestly.
