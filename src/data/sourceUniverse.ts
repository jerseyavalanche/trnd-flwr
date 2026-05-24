export type UniverseSourceStatus =
  | 'connected'
  | 'needs_api_key'
  | 'needs_oauth'
  | 'public_feed_possible'
  | 'scrape_possible'
  | 'paid_vendor_access_needed'
  | 'rate_limited'
  | 'error'
  | 'unavailable'
  | 'disabled'

export type UniverseSignalMode = 'live' | 'near-live' | 'delayed' | 'social' | 'institutional' | 'paid' | 'fragile'

export type UniverseSourceCategory =
  | 'Crypto / Wallet / On-chain'
  | 'Options Flow / Unusual Activity'
  | 'Live Market Data'
  | 'Institutional / Insider / Government'
  | 'News / Social / Attention'
  | 'Prediction / Event Markets'
  | 'Copy-trader / Performance Platforms'
  | 'Technology / Public Feeds'

export type UniverseSource = {
  id: string
  name: string
  category: UniverseSourceCategory
  status: Exclude<UniverseSourceStatus, 'connected'>
  modes: UniverseSignalMode[]
  url: string
  docsUrl?: string
  notes: string
  matchTerms: string[]
}

const source = (
  id: string,
  name: string,
  category: UniverseSourceCategory,
  status: UniverseSource['status'],
  modes: UniverseSignalMode[],
  url: string,
  notes: string,
  matchTerms: string[] = [],
  docsUrl?: string,
): UniverseSource => ({
  id,
  name,
  category,
  status,
  modes,
  url,
  docsUrl,
  notes,
  matchTerms: [name, url, docsUrl ?? '', ...matchTerms].filter(Boolean).map((term) => term.toLowerCase()),
})

export const sourceUniverse: UniverseSource[] = [
  source('arkham', 'Arkham', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://platform.arkhamintelligence.com/', 'Wallet/entity intelligence requires account/API access.', ['arkhamintelligence.com']),
  source('nansen', 'Nansen', 'Crypto / Wallet / On-chain', 'paid_vendor_access_needed', ['near-live', 'paid'], 'https://www.nansen.ai/', 'Paid analytics/vendor access required.'),
  source('whale_alert', 'Whale Alert', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://whale-alert.io/', 'API key required for reliable whale-transfer access.', [], 'https://docs.whale-alert.io/'),
  source('dune', 'Dune', 'Crypto / Wallet / On-chain', 'needs_api_key', ['delayed'], 'https://dune.com/', 'API key required for query-backed ingestion.', [], 'https://dune.com/docs/api/'),
  source('etherscan', 'Etherscan', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://etherscan.io/', 'API key required for scalable chain reads.', [], 'https://docs.etherscan.io/'),
  source('basescan', 'Basescan', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://basescan.org/', 'API key required for scalable Base chain reads.', [], 'https://docs.basescan.org/'),
  source('solscan', 'Solscan', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://solscan.io/', 'API access required for reliable Solana ingestion.', [], 'https://pro-api.solscan.io/pro-api-docs/'),
  source('bscscan', 'BscScan', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://bscscan.com/', 'API key required for scalable BNB Chain reads.', [], 'https://docs.bscscan.com/'),
  source('the_graph', 'The Graph', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://thegraph.com/', 'Subgraph/API access required per target protocol.', [], 'https://thegraph.com/docs/'),
  source('debank', 'DeBank', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://debank.com/', 'Open API requires access credentials.', [], 'https://docs.cloud.debank.com/'),
  source('zerion', 'Zerion', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://zerion.io/', 'Wallet portfolio API requires credentials.', [], 'https://developers.zerion.io/'),
  source('zapper', 'Zapper', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://zapper.xyz/', 'API access required.', [], 'https://protocol.zapper.xyz/'),
  source('dexscreener', 'DexScreener', 'Crypto / Wallet / On-chain', 'public_feed_possible', ['near-live'], 'https://dexscreener.com/', 'Public API is available with rate limits.', [], 'https://docs.dexscreener.com/api/reference'),
  source('birdeye', 'Birdeye', 'Crypto / Wallet / On-chain', 'needs_api_key', ['near-live'], 'https://birdeye.so/', 'API key required.', [], 'https://docs.birdeye.so/'),
  source('geckoterminal', 'GeckoTerminal', 'Crypto / Wallet / On-chain', 'public_feed_possible', ['near-live'], 'https://www.geckoterminal.com/', 'Public DEX API is available with rate limits.', ['geckoterminal.com'], 'https://www.geckoterminal.com/dex-api'),

  source('unusual_whales', 'Unusual Whales', 'Options Flow / Unusual Activity', 'paid_vendor_access_needed', ['live', 'paid'], 'https://unusualwhales.com/', 'Options flow is vendor gated.'),
  source('tradytics', 'Tradytics', 'Options Flow / Unusual Activity', 'paid_vendor_access_needed', ['live', 'paid'], 'https://tradytics.com/', 'Vendor account/access required.'),
  source('cheddar_flow', 'Cheddar Flow', 'Options Flow / Unusual Activity', 'paid_vendor_access_needed', ['live', 'paid'], 'https://www.cheddarflow.com/', 'Vendor account/access required.'),
  source('flowalgo', 'FlowAlgo', 'Options Flow / Unusual Activity', 'paid_vendor_access_needed', ['live', 'paid'], 'https://flowalgo.com/', 'Vendor account/access required.'),
  source('blackboxstocks', 'BlackBoxStocks', 'Options Flow / Unusual Activity', 'paid_vendor_access_needed', ['live', 'paid'], 'https://blackboxstocks.com/', 'Vendor account/access required.'),
  source('orats', 'ORATS', 'Options Flow / Unusual Activity', 'needs_api_key', ['delayed', 'paid'], 'https://orats.com/', 'API/vendor plan required.', [], 'https://orats.com/data-api'),
  source('thetadata', 'ThetaData', 'Options Flow / Unusual Activity', 'paid_vendor_access_needed', ['live', 'paid'], 'https://www.thetadata.net/', 'Vendor data access required.'),
  source('polygon_options', 'Polygon Options API', 'Options Flow / Unusual Activity', 'needs_api_key', ['near-live', 'paid'], 'https://polygon.io/', 'Polygon API key and plan required.', [], 'https://polygon.io/docs/options'),
  source('tradier', 'Tradier API', 'Options Flow / Unusual Activity', 'needs_api_key', ['near-live'], 'https://tradier.com/', 'Broker/API credentials required.', [], 'https://documentation.tradier.com/'),

  source('alpaca', 'Alpaca', 'Live Market Data', 'needs_api_key', ['live'], 'https://alpaca.markets/', 'API credentials required.', [], 'https://alpaca.markets/docs/market-data/'),
  source('polygon_io', 'Polygon.io', 'Live Market Data', 'needs_api_key', ['near-live', 'paid'], 'https://polygon.io/', 'API key and plan required.', [], 'https://polygon.io/docs'),
  source('iex', 'IEX', 'Live Market Data', 'needs_api_key', ['near-live', 'paid'], 'https://iex.io/', 'API key required.', [], 'https://iexcloud.io/docs/api/'),
  source('nasdaq_data_link', 'Nasdaq Data Link', 'Live Market Data', 'needs_api_key', ['delayed', 'paid'], 'https://data.nasdaq.com/', 'API key and dataset entitlements required.', [], 'https://docs.data.nasdaq.com/'),
  source('intrinio', 'Intrinio', 'Live Market Data', 'paid_vendor_access_needed', ['near-live', 'paid'], 'https://intrinio.com/', 'Vendor contract/API access required.', [], 'https://docs.intrinio.com/'),
  source('tiingo', 'Tiingo', 'Live Market Data', 'needs_api_key', ['delayed'], 'https://www.tiingo.com/', 'API token required.', [], 'https://api.tiingo.com/documentation/general/overview'),
  source('alpha_vantage', 'Alpha Vantage', 'Live Market Data', 'needs_api_key', ['delayed'], 'https://www.alphavantage.co/', 'API key required.', [], 'https://www.alphavantage.co/documentation/'),
  source('finnhub', 'Finnhub', 'Live Market Data', 'needs_api_key', ['near-live'], 'https://finnhub.io/', 'API key required.', [], 'https://finnhub.io/docs/api'),
  source('twelve_data', 'Twelve Data', 'Live Market Data', 'needs_api_key', ['near-live'], 'https://twelvedata.com/', 'API key required.', [], 'https://twelvedata.com/docs'),
  source('yahoo_finance', 'Yahoo Finance unofficial feeds', 'Live Market Data', 'scrape_possible', ['delayed', 'fragile'], 'https://finance.yahoo.com/', 'Fragile/unofficial source. Pull only if currently working; do not imply vendor-grade market data.', ['yahoo finance']),

  source('sec_edgar_13f', 'SEC EDGAR 13F', 'Institutional / Insider / Government', 'public_feed_possible', ['institutional', 'delayed'], 'https://data.sec.gov/', 'Public SEC source; filings are delayed by filing schedule.', [], 'https://www.sec.gov/search-filings/edgar-application-programming-interfaces'),
  source('sec_13f_datasets', 'SEC 13F Data Sets', 'Institutional / Insider / Government', 'public_feed_possible', ['institutional', 'delayed'], 'https://www.sec.gov/data-research/sec-markets-data/form-13f-data-sets', 'Public SEC quarterly 13F datasets.', [], 'https://www.sec.gov/search-filings/edgar-application-programming-interfaces'),
  source('sec_form_4', 'SEC Form 4', 'Institutional / Insider / Government', 'public_feed_possible', ['institutional', 'delayed'], 'https://data.sec.gov/', 'Public insider filing source.', [], 'https://www.sec.gov/search-filings/edgar-application-programming-interfaces'),
  source('sec_13d_13g', 'SEC Schedule 13D / 13G', 'Institutional / Insider / Government', 'public_feed_possible', ['institutional', 'delayed'], 'https://data.sec.gov/', 'Public beneficial ownership filing source.', [], 'https://www.sec.gov/search-filings/edgar-application-programming-interfaces'),
  source('quiver_quantitative', 'Quiver Quantitative', 'Institutional / Insider / Government', 'paid_vendor_access_needed', ['institutional', 'paid'], 'https://www.quiverquant.com/', 'Vendor access required for full datasets/API.'),
  source('capitol_trades', 'Capitol Trades', 'Institutional / Insider / Government', 'public_feed_possible', ['institutional', 'delayed'], 'https://www.capitoltrades.com/', 'Public pages may be accessible; API/vendor terms must be respected.'),
  source('openinsider', 'OpenInsider', 'Institutional / Insider / Government', 'public_feed_possible', ['institutional', 'delayed'], 'http://openinsider.com/', 'Public insider transaction pages.'),

  source('benzinga', 'Benzinga', 'News / Social / Attention', 'paid_vendor_access_needed', ['live', 'paid'], 'https://www.benzinga.com/', 'Newswire/API access requires vendor plan.', [], 'https://www.benzinga.com/apis/'),
  source('mt_newswires', 'MT Newswires', 'News / Social / Attention', 'paid_vendor_access_needed', ['live', 'paid'], 'https://www.mtnewswires.com/', 'Newswire vendor access required.'),
  source('dow_jones_factiva', 'Dow Jones / Factiva', 'News / Social / Attention', 'paid_vendor_access_needed', ['live', 'paid'], 'https://www.dowjones.com/professional/factiva/', 'Licensed vendor access required.'),
  source('gdelt', 'GDELT', 'News / Social / Attention', 'public_feed_possible', ['near-live'], 'https://www.gdeltproject.org/', 'Public global events/news metadata APIs are available.', [], 'https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/'),
  source('reddit', 'Reddit', 'News / Social / Attention', 'public_feed_possible', ['social'], 'https://www.reddit.com/', 'Public subreddit RSS feeds are possible; API access may require credentials.', ['reddit.com'], 'https://www.reddit.com/dev/api/'),
  source('hacker_news', 'Hacker News', 'News / Social / Attention', 'public_feed_possible', ['social', 'near-live'], 'https://news.ycombinator.com/', 'Official Firebase-backed public API is available.', ['news.ycombinator.com', 'ycombinator'], 'https://github.com/HackerNews/API'),
  source('stocktwits', 'Stocktwits', 'News / Social / Attention', 'needs_api_key', ['social', 'near-live'], 'https://stocktwits.com/', 'API credentials/access required.', [], 'https://api.stocktwits.com/developers/docs'),
  source('x_twitter', 'X / Twitter', 'News / Social / Attention', 'needs_oauth', ['social', 'near-live'], 'https://developer.x.com/', 'OAuth/API access required; no scraping implied.', [], 'https://docs.x.com/'),
  source('google_trends', 'Google Trends', 'News / Social / Attention', 'unavailable', ['social', 'delayed'], 'https://trends.google.com/trends/', 'No official public API configured.'),
  source('youtube_data_api', 'YouTube Data API', 'News / Social / Attention', 'needs_api_key', ['social', 'near-live'], 'https://developers.google.com/youtube/v3', 'API key required.'),

  source('polymarket', 'Polymarket', 'Prediction / Event Markets', 'public_feed_possible', ['near-live'], 'https://polymarket.com/', 'Public/event APIs may be available; connector not active unless configured.', [], 'https://docs.polymarket.com/'),
  source('kalshi', 'Kalshi', 'Prediction / Event Markets', 'needs_api_key', ['near-live'], 'https://kalshi.com/', 'API credentials required.', [], 'https://trading-api.readme.io/'),
  source('manifold_markets', 'Manifold Markets', 'Prediction / Event Markets', 'public_feed_possible', ['near-live'], 'https://manifold.markets/', 'Public API is available with limits.', [], 'https://docs.manifold.markets/api'),

  source('etoro_copytrader', 'eToro CopyTrader', 'Copy-trader / Performance Platforms', 'unavailable', ['social'], 'https://www.etoro.com/copytrader/', 'No approved ingestion connector configured.'),
  source('kinfo', 'Kinfo', 'Copy-trader / Performance Platforms', 'unavailable', ['social'], 'https://kinfo.com/', 'No approved ingestion connector configured.'),
  source('collective2', 'Collective2', 'Copy-trader / Performance Platforms', 'paid_vendor_access_needed', ['delayed', 'paid'], 'https://collective2.com/', 'Vendor/platform access required.'),
  source('darwinex', 'Darwinex', 'Copy-trader / Performance Platforms', 'paid_vendor_access_needed', ['delayed', 'paid'], 'https://www.darwinex.com/', 'Vendor/platform access required.'),
  source('exchange_copy_trading', 'Exchange copy-trading leaderboards where allowed', 'Copy-trader / Performance Platforms', 'disabled', ['social'], 'https://www.binance.com/en/copy-trading', 'Disabled until exchange-specific terms and allowed endpoints are confirmed.'),

  source('github_blog', 'GitHub Blog', 'Technology / Public Feeds', 'public_feed_possible', ['near-live'], 'https://github.blog/feed/', 'Public RSS feed is available.', ['github.blog']),
  source('the_verge', 'The Verge RSS', 'News / Social / Attention', 'public_feed_possible', ['near-live'], 'https://www.theverge.com/rss/index.xml', 'Public RSS feed is available.', ['theverge.com']),
]
