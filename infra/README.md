# Oracle Free Stack (Phase 1 Scaffold)

This folder provides a free-first deployment scaffold for Oracle Always Free ARM VPS.

## Quick start
1. `cp infra/.env.oracle.example infra/.env`
2. Set strong passwords and domain values.
3. `docker compose --env-file infra/.env -f infra/docker-compose.oracle-free.yml up -d`

## Included services
- `trnd-backend`
- `trnd-frontend`
- `postgres`
- `redis` (optional utility)
- `n8n`
- `uptime-kuma`
- `grafana`
- `caddy`

## Files
- `infra/docker-compose.oracle-free.yml`
- `infra/.env.oracle.example`
- `infra/Caddyfile`

## ARM guidance
All selected images are multi-arch friendly; validate image tags on deployment day.

## Unavailable-state policy
If any service/module is missing or down, TRND_FLWR surfaces `unavailable`/`degraded` states in `/api/status` and UI.
