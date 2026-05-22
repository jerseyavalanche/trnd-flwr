# TRND_FLWR

TRND_FLWR is a civilization trend intelligence engine focused on real signal ingestion and honest unavailable-state reporting.

## Mission
Observe public data across technology, media, economics, and markets to answer:
**what is humanity collectively moving toward right now?**

## Hard rules
- No mock data
- No fake dashboards
- No fake market prices
- No demo mode
- Unavailable sources must be shown honestly
- Free-first infra and free-model-default policy

## Free-first architecture
- Frontend: React + TypeScript + Tailwind
- Backend: Node/Express + SSE
- Storage: local JSON fallback now, PostgreSQL-ready later
- Deployment target: Oracle Cloud Always Free ARM (later, optional)

See:
- `docs/ARCHITECTURE_FREE_FIRST.md`
- `docs/DEPLOYMENT_FREE.md`
- `docs/ORACLE_ALWAYS_FREE.md`

## Local setup
```bash
cp .env.example .env
npm install
npm run local
```

Useful checks:
```bash
npm run lint
npm run healthcheck
npm run worker:scan
```

## What works without API keys
- RSS adapter
- Reddit public feed adapter
- GitHub public unauthenticated search (rate-limited)
- Yahoo market endpoint (provider=yahoo)
- GDELT adapter (if enabled)

## What requires keys
- FRED adapter requires `FRED_API_KEY`
- OpenRouter synthesis requires `ENABLE_OPENROUTER=true` + `OPENROUTER_API_KEY`

If model keys are missing, UI/API reports: `model synthesis unavailable`.
