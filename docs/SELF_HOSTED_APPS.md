# Self-Hosted Apps in TRND_FLWR Architecture

## Coolify
Use for service lifecycle and compose deployment management (optional, not required for local).

## n8n
Use for ingestion scheduling and webhook-triggered scans.
- TRND_FLWR webhook endpoints:
  - `POST /api/ingest/webhook`
  - `POST /api/ingest/n8n`

## Uptime Kuma
Monitor:
- `/api/health`
- `/api/status`
- `/api/sources/status`
- `/api/metrics`

## Grafana OSS
Visualize ingestion/system metrics pulled from `/api/metrics`.

## Postgres
Primary long-term memory target for:
- raw source records
- themes
- collisions
- temporal comparisons

## Redis
Optional but useful for queue state, short-lived worker status, and cache.
