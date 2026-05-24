# TRND_FLWR Signal Index

Signal Index normalizes source material into ranked signal cards across markets, technology, macro, narrative, social, and prediction-market inputs.

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

## Development

```bash
npm run dev
```

```bash
npm run build
```
