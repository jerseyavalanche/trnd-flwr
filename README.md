# TRND_FLWR (Phase 1)

Mobile-first civilization trend intelligence engine with **real ingestion only**.

## Stack
- React + TypeScript + Tailwind
- Node + Express backend
- Source adapters with unavailable states
- SSE live refresh (60s)
- JSON snapshot persistence fallback (`server/data/radar-cache.json`)

## Real source adapters implemented
- RSS News: NYT Technology RSS
- GitHub: repository search API (rolling 14-day window)
- Reddit: public JSON feed (`r/technology/new`)
- Markets: Yahoo Finance quote endpoint
- Economics: FRED observations endpoint (supports `FRED_API_KEY`)

## Run
```bash
npm install
npm run dev
```

Optional env:
- `VITE_API_BASE_URL` (frontend API base)
- `FRED_API_KEY` (improves FRED reliability)
- `RADAR_STORE_PATH` (snapshot file path)

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000/api/radar
- SSE stream: http://localhost:4000/api/stream

## Phase 1 pages
- Radar dashboard (source health + live signals)
- Themes (source-cluster counts)
- Signal Streams (chronological stream)
- Decisions Engine (top scored priorities)
- Content Engine (brief seed from live items)
- Export Center (download JSON snapshot)

No mock data. If a source fails, it is surfaced as `unavailable` with details.
