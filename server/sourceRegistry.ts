import { CanonicalSource, SourceCategory, SourceStatus, TrustTier } from "./types.js";

const canonicalSnapshotTimestamp = "2026-05-24T11:30:00Z";

const source = (
  sourceName: string,
  category: SourceCategory,
  trustTier: TrustTier,
  status: SourceStatus,
  url: string,
  latestErrorMessage?: string
): CanonicalSource => ({
  source: sourceName,
  category,
  trust_tier: trustTier,
  status,
  url,
  timestamp: canonicalSnapshotTimestamp,
  last_fetch_time: canonicalSnapshotTimestamp,
  card_count: 0,
  latest_error_message: latestErrorMessage,
});

export const sourceRankingRules = [
  "Official data beats news.",
  "News beats social.",
  "Social beats influencer claims only when volume/velocity confirms it.",
  "Prediction markets are sentiment/expectation, not truth.",
  "Every item must show source, category, trust tier, timestamp, and URL.",
  "Every source must show status: LIVE, DEGRADED, OFFLINE, AUTH NEEDED, LIMITED, or PLANNED.",
] as const;

export const canonicalSignalSources: CanonicalSource[] = [
  source("SEC EDGAR", "official", "official", "LIVE", "https://www.sec.gov/edgar"),
  source("FRED", "official", "official", "LIVE", "https://fred.stlouisfed.org/"),
  source("Treasury Fiscal Data", "official", "official", "LIVE", "https://fiscaldata.treasury.gov/"),
  source("Federal Reserve", "official", "official", "LIVE", "https://www.federalreserve.gov/"),
  source("BLS", "official", "official", "LIVE", "https://www.bls.gov/"),
  source("BEA", "official", "official", "LIVE", "https://www.bea.gov/"),
  source("CISA", "official", "official", "LIVE", "https://www.cisa.gov/news-events/cybersecurity-advisories"),
  source("NVD", "official", "official", "LIVE", "https://nvd.nist.gov/"),

  source("Yahoo Finance", "market", "market", "LIMITED", "https://finance.yahoo.com/"),
  source("CoinGecko", "market", "market", "LIVE", "https://www.coingecko.com/"),
  source("Alpaca", "market", "market", "AUTH NEEDED", "https://alpaca.markets/", "Requires account credentials."),
  source("OpenBB", "market", "market", "PLANNED", "https://openbb.co/"),
  source("Nasdaq Calendar", "market", "market", "LIMITED", "https://www.nasdaq.com/market-activity/earnings"),

  source("GitHub", "tech_ai", "news", "LIVE", "https://github.com/"),
  source("Hacker News", "tech_ai", "news", "LIVE", "https://news.ycombinator.com/"),
  source("arXiv", "tech_ai", "news", "LIVE", "https://arxiv.org/"),
  source("Papers with Code", "tech_ai", "news", "LIMITED", "https://paperswithcode.com/"),
  source("Hugging Face", "tech_ai", "news", "LIVE", "https://huggingface.co/"),
  source("Product Hunt", "tech_ai", "news", "AUTH NEEDED", "https://www.producthunt.com/", "API access requires credentials."),
  source("NVIDIA Blog", "tech_ai", "news", "LIVE", "https://blogs.nvidia.com/"),
  source("OpenAI Blog", "tech_ai", "news", "LIVE", "https://openai.com/blog/"),
  source("Anthropic News", "tech_ai", "news", "LIVE", "https://www.anthropic.com/news"),
  source("Google DeepMind Blog", "tech_ai", "news", "LIVE", "https://deepmind.google/discover/blog/"),
  source("Meta AI Blog", "tech_ai", "news", "LIVE", "https://ai.meta.com/blog/"),
  source("Vercel Changelog", "tech_ai", "news", "LIVE", "https://vercel.com/changelog"),
  source("Supabase Changelog", "tech_ai", "news", "LIVE", "https://supabase.com/changelog"),
  source("Cloudflare Blog", "tech_ai", "news", "LIVE", "https://blog.cloudflare.com/"),
  source("Cloudflare Changelog", "tech_ai", "news", "LIVE", "https://developers.cloudflare.com/changelog/"),
  source("Replit Changelog", "tech_ai", "news", "LIVE", "https://replit.com/changelog"),
  source("Cursor Release Feed", "tech_ai", "news", "PLANNED", "https://cursor.com/changelog"),
  source("Aider Release Feed", "tech_ai", "news", "PLANNED", "https://github.com/Aider-AI/aider/releases"),
  source("Continue.dev Release Feed", "tech_ai", "news", "PLANNED", "https://github.com/continuedev/continue/releases"),
  source("Trae Release Feed", "tech_ai", "news", "PLANNED", "https://www.trae.ai/"),
  source("Windsurf Release Feed", "tech_ai", "news", "PLANNED", "https://windsurf.com/changelog"),

  source("GDELT", "news_narrative", "news", "LIVE", "https://www.gdeltproject.org/"),
  source("BBC RSS", "news_narrative", "news", "LIVE", "https://www.bbc.com/news"),
  source("NPR RSS", "news_narrative", "news", "LIVE", "https://www.npr.org/"),
  source("Reuters Public Links", "news_narrative", "news", "LIMITED", "https://www.reuters.com/"),
  source("AP Public Links", "news_narrative", "news", "LIMITED", "https://apnews.com/"),
  source("The Guardian Open Platform", "news_narrative", "news", "AUTH NEEDED", "https://open-platform.theguardian.com/", "API key required."),
  source("TechCrunch RSS", "news_narrative", "news", "LIVE", "https://techcrunch.com/"),
  source("The Verge RSS", "news_narrative", "news", "LIVE", "https://www.theverge.com/"),
  source("Ars Technica RSS", "news_narrative", "news", "LIVE", "https://arstechnica.com/"),
  source("Axios RSS", "news_narrative", "news", "LIMITED", "https://www.axios.com/"),

  source("Reddit r/technology", "social_culture", "social", "LIMITED", "https://www.reddit.com/r/technology/"),
  source("Reddit r/artificial", "social_culture", "social", "LIMITED", "https://www.reddit.com/r/artificial/"),
  source("Reddit r/futurology", "social_culture", "social", "LIMITED", "https://www.reddit.com/r/Futurology/"),
  source("Reddit r/geopolitics", "social_culture", "social", "LIMITED", "https://www.reddit.com/r/geopolitics/"),
  source("Reddit r/stocks", "social_culture", "social", "LIMITED", "https://www.reddit.com/r/stocks/"),
  source("Reddit r/economics", "social_culture", "social", "LIMITED", "https://www.reddit.com/r/Economics/"),
  source("Reddit r/investing", "social_culture", "social", "LIMITED", "https://www.reddit.com/r/investing/"),
  source("Reddit r/singularity", "social_culture", "social", "LIMITED", "https://www.reddit.com/r/singularity/"),
  source("YouTube RSS", "social_culture", "social", "LIMITED", "https://www.youtube.com/feeds/videos.xml", "Requires selected channel list."),
  source("Wikipedia Current Events", "social_culture", "social", "LIVE", "https://en.wikipedia.org/wiki/Portal:Current_events"),
  source("Wikipedia Pageviews", "social_culture", "social", "LIVE", "https://pageviews.wmcloud.org/"),
  source("Bluesky", "social_culture", "social", "PLANNED", "https://bsky.app/"),
  source("Mastodon", "social_culture", "social", "PLANNED", "https://joinmastodon.org/"),

  source("Polymarket", "prediction", "prediction", "LIVE", "https://polymarket.com/"),
  source("Kalshi", "prediction", "prediction", "LIMITED", "https://kalshi.com/"),
  source("Metaculus", "prediction", "prediction", "LIMITED", "https://www.metaculus.com/"),
];
