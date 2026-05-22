# Oracle Free Stack (Phase 1 Scaffold)

This folder provides a free-first deployment scaffold for Oracle Always Free ARM VPS.

## Quick start
1. `cp infra/.env.oracle.example infra/.env`
2. Adjust passwords and domain values.
3. `docker compose --env-file infra/.env -f infra/docker-compose.oracle-free.yml up -d`

## Notes
- Compose is scaffold-first: run TRND_FLWR locally before VPS deployment.
- Coolify can manage these services later.
- Caddy is included as a reverse-proxy placeholder (`/`, `/api`, `/n8n`, `/status`, `/grafana`).
- If a module is not configured, TRND_FLWR reports it as unavailable in API/UI status.
