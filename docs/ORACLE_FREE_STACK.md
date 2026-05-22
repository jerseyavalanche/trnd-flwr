# Oracle Free Stack Target

TRND_FLWR deployment target is **Oracle Cloud Always Free Ampere A1 ARM**.

## Principles
- Free/self-hosted by default
- Local-first development remains mandatory
- No paid model API required
- Honest unavailable states for missing modules/keys

## Primary stack modules
- TRND_FLWR frontend + backend
- Postgres (primary memory moat target)
- Redis (queue/cache, optional)
- n8n (automation/ingestion orchestration)
- Uptime Kuma (health monitoring)
- Grafana OSS (observability)
- Caddy/Nginx (reverse proxy + HTTPS)
- Coolify (optional deployment manager)
