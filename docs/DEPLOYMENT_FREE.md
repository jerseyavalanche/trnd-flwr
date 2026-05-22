# Free Deployment Path (Phase 1)

## Local first (required)
1. `cp .env.example .env`
2. `npm install`
3. `npm run local`
4. Optional checks: `npm run healthcheck`, `npm run worker:scan`

## Oracle Always Free VPS (later)
Deploy to Oracle Cloud Always Free Ampere A1 ARM VM (Ubuntu aarch64).

## Docker Compose preferred path
1. `cp infra/.env.oracle.example infra/.env`
2. Update passwords, domain, and ports.
3. `docker compose --env-file infra/.env -f infra/docker-compose.oracle-free.yml up -d`

## Reverse proxy
- Caddy config scaffold is included at `infra/Caddyfile`.
- Routes:
  - `/` -> TRND frontend
  - `/api` -> TRND backend
  - `/n8n` -> n8n
  - `/status` -> Uptime Kuma
  - `/grafana` -> Grafana

## ARM64 notes
- Use Node 20+ ARM64.
- Keep dependencies lightweight and avoid native build-heavy packages when possible.

## Backup/recovery minimum
- Persist volumes for `pg_data`, `trnd_storage`, and `grafana_data`.
- Snapshot `infra/.env` securely (without exposing secrets).
- Back up Postgres regularly (e.g., daily `pg_dump`).

## Optional components (later)
- Coolify orchestration on top of compose
- Managed Postgres alternatives if self-hosting changes
