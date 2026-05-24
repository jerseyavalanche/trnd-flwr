import type { SourceAdapter, SourceStatus } from "./types.js";
import { dexScreenerAdapter } from "./adapters/dexScreener.js";
import { gdeltAdapter } from "./adapters/gdelt.js";
import { hackerNewsAdapter } from "./adapters/hackerNews.js";
import { openInsiderAdapter } from "./adapters/openInsider.js";
import { polymarketAdapter } from "./adapters/polymarket.js";
import { redditAdapter } from "./adapters/reddit.js";
import { rssFeedsAdapter } from "./adapters/rssFeeds.js";
import { secEdgarAdapter } from "./adapters/secEdgar.js";

type SourceMeta = Omit<SourceStatus, "lastAttemptAt" | "lastSuccessAt" | "lastError" | "latestItemCount" | "totalItemCount">;

const keyed = (id: string, name: string, category: SourceStatus["category"], url: string, docsUrl = url, envVars: string[] = []): SourceMeta => ({
  id,
  name,
  category,
  url,
  enabled: false,
  status: "needs_api_key",
  connectionType: "api_key",
  docsUrl,
  needsApiKey: true,
  paidRequired: false,
  envVars,
});

const vendor = (id: string, name: string, category: SourceStatus["category"], url: string, docsUrl = url, envVars: string[] = []): SourceMeta => ({
  id,
  name,
  category,
  url,
  enabled: false,
  status: "paid_required",
  connectionType: "vendor",
  docsUrl,
  needsApiKey: true,
  paidRequired: true,
  envVars,
});

const unavailable = (id: string, name: string, category: SourceStatus["category"], url: string, docsUrl = url): SourceMeta => ({
  id,
  name,
  category,
  url,
  enabled: false,
  status: "unavailable",
  connectionType: "unknown",
  docsUrl,
  needsApiKey: false,
  paidRequired: false,
});

const platformLimited = (id: string, name: string, category: SourceStatus["category"], url: string, docsUrl = url): SourceMeta => ({
  id,
  name,
  category,
  url,
  enabled: false,
  status: "platform_limited",
  connectionType: "manual",
  docsUrl,
  needsApiKey: false,
  paidRequired: false,
  platformLimited: true,
});

const publicSource = (adapter: SourceAdapter): SourceMeta => ({
  id: adapter.id,
  name: adapter.name,
  category: adapter.category,
  url: adapter.url,
  enabled: adapter.enabledByDefault,
  status: adapter.enabledByDefault ? "connected" : "disabled",
  connectionType: adapter.connectionType,
  docsUrl: adapter.docsUrl,
  needsApiKey: adapter.requiresApiKey,
  paidRequired: adapter.paidRequired,
  platformLimited: adapter.platformLimited,
  envVars: adapter.envVars,
});

export const publicAdapters: SourceAdapter[] = [
  hackerNewsAdapter,
  gdeltAdapter,
  secEdgarAdapter,
  dexScreenerAdapter,
  polymarketAdapter,
  openInsiderAdapter,
  redditAdapter,
  rssFeedsAdapter,
];

const publicMetas = publicAdapters.map(publicSource);

export const sourceRegistry: SourceMeta[] = [
  vendor("arkham", "Arkham", "crypto", "https://platform.arkhamintelligence.com/"),
  vendor("nansen", "Nansen", "crypto", "https://www.nansen.ai/"),
  keyed("whale_alert", "Whale Alert", "crypto", "https://whale-alert.io/", "https://docs.whale-alert.io/", ["WHALE_ALERT_API_KEY"]),
  vendor("dune", "Dune", "crypto", "https://docs.dune.com/"),
  keyed("etherscan", "Etherscan", "crypto", "https://etherscan.io/", "https://docs.etherscan.io/", ["ETHERSCAN_API_KEY"]),
  keyed("basescan", "Basescan", "crypto", "https://basescan.org/", "https://docs.basescan.org/", ["BASESCAN_API_KEY"]),
  keyed("solscan", "Solscan", "crypto", "https://solscan.io/", "https://pro-api.solscan.io/pro-api-docs/", ["SOLSCAN_API_KEY"]),
  keyed("bscscan", "BscScan", "crypto", "https://bscscan.com/", "https://docs.bscscan.com/", ["BSCSCAN_API_KEY"]),
  keyed("the_graph", "The Graph", "crypto", "https://thegraph.com/", "https://thegraph.com/docs/", ["THE_GRAPH_API_KEY"]),
  vendor("debank", "DeBank", "crypto", "https://docs.cloud.debank.com/"),
  vendor("zerion", "Zerion", "crypto", "https://developers.zerion.io/"),
  vendor("zapper", "Zapper", "crypto", "https://protocol.zapper.xyz/"),
  publicMetas.find((source) => source.id === "dexscreener")!,
  keyed("birdeye", "Birdeye", "crypto", "https://docs.birdeye.so/"),
  keyed("geckoterminal", "GeckoTerminal", "crypto", "https://www.geckoterminal.com/dex-api"),
  keyed("unusual_whales", "Unusual Whales", "options", "https://unusualwhales.com/", "https://unusualwhales.com/public-api", ["UNUSUAL_WHALES_API_KEY"]),
  vendor("tradytics", "Tradytics", "options", "https://tradytics.com/"),
  vendor("cheddar_flow", "Cheddar Flow", "options", "https://www.cheddarflow.com/"),
  vendor("flowalgo", "FlowAlgo", "options", "https://flowalgo.com/"),
  vendor("blackboxstocks", "BlackBoxStocks", "options", "https://blackboxstocks.com/"),
  vendor("orats", "ORATS", "options", "https://orats.com/data-api"),
  vendor("thetadata", "ThetaData", "options", "https://www.thetadata.net/"),
  keyed("polygon_options", "Polygon Options API", "options", "https://polygon.io/", "https://polygon.io/docs/options", ["POLYGON_API_KEY"]),
  vendor("tradier", "Tradier API", "options", "https://documentation.tradier.com/"),
  keyed("alpaca", "Alpaca", "market", "https://alpaca.markets/", "https://docs.alpaca.markets/", ["ALPACA_API_KEY", "ALPACA_SECRET_KEY"]),
  keyed("polygon_io", "Polygon.io", "market", "https://polygon.io/", "https://polygon.io/docs", ["POLYGON_API_KEY"]),
  keyed("iex", "IEX", "market", "https://iex.io/", "https://iexcloud.io/docs/api/", ["IEX_API_KEY"]),
  keyed("nasdaq_data_link", "Nasdaq Data Link", "market", "https://data.nasdaq.com/", "https://docs.data.nasdaq.com/", ["NASDAQ_DATA_LINK_API_KEY"]),
  keyed("intrinio", "Intrinio", "market", "https://intrinio.com/", "https://docs.intrinio.com/", ["INTRINIO_API_KEY"]),
  keyed("tiingo", "Tiingo", "market", "https://www.tiingo.com/", "https://api.tiingo.com/documentation/general/overview", ["TIINGO_API_KEY"]),
  keyed("alpha_vantage", "Alpha Vantage", "market", "https://www.alphavantage.co/", "https://www.alphavantage.co/documentation/", ["ALPHA_VANTAGE_API_KEY"]),
  keyed("finnhub", "Finnhub", "market", "https://finnhub.io/", "https://finnhub.io/docs/api", ["FINNHUB_API_KEY"]),
  keyed("twelve_data", "Twelve Data", "market", "https://twelvedata.com/", "https://twelvedata.com/docs", ["TWELVE_DATA_API_KEY"]),
  unavailable("yahoo_finance", "Yahoo Finance unofficial feeds", "market", "https://finance.yahoo.com/"),
  publicMetas.find((source) => source.id === "sec_edgar")!,
  vendor("quiver_quantitative", "Quiver Quantitative", "institutional", "https://www.quiverquant.com/"),
  vendor("capitol_trades", "Capitol Trades", "institutional", "https://www.capitoltrades.com/"),
  publicMetas.find((source) => source.id === "openinsider")!,
  keyed("benzinga", "Benzinga", "news", "https://www.benzinga.com/apis/", "https://docs.benzinga.io/", ["BENZINGA_API_KEY"]),
  vendor("mt_newswires", "MT Newswires", "news", "https://www.mtnewswires.com/"),
  vendor("dow_jones_factiva", "Dow Jones / Factiva", "news", "https://www.dowjones.com/professional/factiva/"),
  publicMetas.find((source) => source.id === "gdelt")!,
  publicMetas.find((source) => source.id === "reddit")!,
  publicMetas.find((source) => source.id === "hacker_news")!,
  keyed("stocktwits", "Stocktwits", "social", "https://stocktwits.com/", "https://api.stocktwits.com/developers/docs", ["STOCKTWITS_ACCESS_TOKEN"]),
  { ...keyed("x_twitter", "X / Twitter", "social", "https://developer.x.com/", "https://docs.x.com/", ["X_API_KEY", "TWITTER_BEARER_TOKEN"]), status: "needs_oauth", connectionType: "oauth" },
  unavailable("google_trends", "Google Trends", "social", "https://trends.google.com/trends/"),
  keyed("youtube_data_api", "YouTube Data API", "social", "https://developers.google.com/youtube/v3", "https://developers.google.com/youtube/v3", ["YOUTUBE_API_KEY"]),
  publicMetas.find((source) => source.id === "polymarket")!,
  keyed("kalshi", "Kalshi", "prediction", "https://trading-api.readme.io/"),
  unavailable("manifold_markets", "Manifold Markets", "prediction", "https://docs.manifold.markets/api"),
  platformLimited("etoro_copytrader", "eToro CopyTrader", "copytrader", "https://www.etoro.com/copytrader/"),
  platformLimited("kinfo", "Kinfo", "copytrader", "https://kinfo.com/"),
  platformLimited("collective2", "Collective2", "copytrader", "https://collective2.com/"),
  platformLimited("darwinex", "Darwinex", "copytrader", "https://www.darwinex.com/"),
  platformLimited("binance_copy_trading", "Binance Copy Trading", "copytrader", "https://www.binance.com/en/copy-trading"),
  platformLimited("bybit_copy_trading", "Bybit Copy Trading", "copytrader", "https://www.bybit.com/"),
  platformLimited("okx_copy_trading", "OKX Copy Trading", "copytrader", "https://www.okx.com/"),
  platformLimited("bitget_copy_trading", "Bitget Copy Trading", "copytrader", "https://www.bitget.com/"),
  publicMetas.find((source) => source.id === "rss_feeds")!,
];

export const getRunnableAdapters = () =>
  publicAdapters.filter((adapter) => adapter.enabledByDefault && !adapter.requiresApiKey && !adapter.paidRequired);
