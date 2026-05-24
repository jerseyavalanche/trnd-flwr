# TRND_FLWR Signal Index

TRND_FLWR normalizes real source material into live intelligence cards across markets, technology, macro, narrative, social, and prediction-market inputs.

## Configure Real Source Feeds

Create a local `.env` file from `.env.example` and set one or both RSS feed lists. Values are comma-separated URLs.

```bash
cp .env.example .env
```

```dotenv
TRND_FLWR_RSS_FEEDS=https://news.ycombinator.com/rss,https://github.blog/feed/,https://www.reddit.com/r/MachineLearning/.rss
NEWS_RSS_FEEDS=https://www.theverge.com/rss/index.xml,https://feeds.a.dj.com/rss/RSSMarketsMain.xml
VITE_APP_NAME=TRND_FLWR
```

These examples are documentation only. The app will not pull sources until you put URLs in your own `.env`.

With no source URLs configured, the app loads normally, shows an empty state, and disables live pulls with `NO_SOURCES_CONFIGURED`.

## Canonical Sources

The canonical source stack lives in `server/sourceRegistry.ts` and is exposed at `GET /api/signals/sources`. Each source record must include `source`, `category`, `trust_tier`, `status`, `timestamp`, and `url`.

Source status must be one of:

- `LIVE`
- `DEGRADED`
- `OFFLINE`
- `AUTH NEEDED`
- `LIMITED`
- `PLANNED`

## Ranking Policy

Signal Index does not treat all sources equally:

- Official data beats news.
- News beats social.
- Social beats influencer claims only when volume or velocity confirms it.
- Prediction markets are sentiment and expectation signals, not truth.
- Every item must show source, category, trust tier, timestamp, and URL.
- Every source must show its current status.

## Source Categories

- `official`: SEC EDGAR, FRED, Treasury Fiscal Data, Federal Reserve, BLS, BEA, CISA, NVD.
- `market`: Yahoo Finance, CoinGecko, Alpaca, OpenBB, Nasdaq/calendar sources.
- `tech_ai`: GitHub, Hacker News, arXiv, Papers with Code, Hugging Face, Product Hunt, major AI/company blogs, and release feeds.
- `news_narrative`: GDELT, BBC, NPR, Reuters/AP public links, Guardian Open Platform, TechCrunch, The Verge, Ars Technica, Axios.
- `social_culture`: selected Reddit communities, YouTube RSS, Wikipedia current events, Wikipedia pageviews, Bluesky, Mastodon.
- `prediction`: Polymarket, Kalshi, Metaculus.

## Local Development

```bash
npm run dev
```

```bash
npm run build
```

The Vite client proxies `/api` to the local Express server started by `npm run dev`.

## Cursor Automation

Set `CURSOR_API_KEY` locally or as a GitHub Actions repository secret before running Cursor automation.

```bash
npm run verify
```

```bash
npm run cursor:review
```

```bash
npm run cursor:local -- "summarize the current repo state"
```

```bash
npm run cursor:cloud -- "implement the next ingestion hardening task and open a PR"
```

```bash
npm run cursor:ship
```

- `cursor:review` runs a local, read-only branch review against `origin/main`.
- `cursor:local` sends a custom local prompt against this checkout.
- `cursor:cloud` creates a cloud agent from the current branch or `CURSOR_STARTING_REF`; it auto-creates a PR unless `CURSOR_AUTO_PR=false`.
- `cursor:ship` runs `npm run verify` first, then starts the cloud PR workflow.

GitHub Actions includes a standard CI workflow plus a manual **Cursor Automation** workflow. Add the `CURSOR_API_KEY` repository secret before using the manual workflow.

## Source Pulls

Use **Pull Live Sources** in the UI, or call:

```bash
curl -X POST http://localhost:4000/api/sources/pull
```

The puller parses configured RSS/Atom feeds, deduplicates by canonical URL, extracts source-provided titles, links, publish times, summaries, and images when present, and leaves missing fields empty. It does not generate fake stories, fake summaries, or placeholder market signals.

## Degraded Mode

If Firebase Admin credentials are missing, Firestore persistence reports degraded mode. The app remains usable in source-only mode: live pull results are kept in server memory for the current dev session and rendered in the feed, but they are not persisted.

To enable persistence, configure Firebase Admin credentials:

```dotenv
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

Alternatively, configure Google default application credentials for the local shell before starting the server. Credential errors are shown in the Source Health card instead of being hidden.
