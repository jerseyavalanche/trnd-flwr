export type MarketQuote = {
  symbol: string;
  price: number;
  changePercent: number | null;
  source: "stooq" | "coingecko";
  sourceSymbol: string;
  asOf: string | null;
};

export type MarketQuotesResponse = {
  status: "ok" | "partial" | "error";
  message: string;
  quotes: MarketQuote[];
  errors: { source: string; message: string }[];
  pulledAt: string;
};

type StooqRow = {
  symbol: string;
  date: string;
  time: string;
  open: number | null;
  close: number | null;
};

const DEFAULT_EQUITY_SYMBOLS = ["SPY", "QQQ", "NVDA", "AAPL", "TSLA"];
const DEFAULT_CRYPTO_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
};

let cachedQuotes: { expiresAt: number; response: MarketQuotesResponse } | null = null;

const parseNumber = (value: string | undefined) => {
  if (!value || value === "N/D") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const fetchText = async (url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "TRND_FLWR/0.1" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
};

const fetchJson = async <T>(url: string) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "TRND_FLWR/0.1" },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
};

const parseStooqCsv = (csv: string): StooqRow | null => {
  const [, row] = csv.trim().split(/\r?\n/);
  if (!row) return null;
  const [symbol, date, time, open, , , close] = row.split(",");
  const parsedOpen = parseNumber(open);
  const parsedClose = parseNumber(close);
  if (!symbol || parsedClose === null) return null;
  return {
    symbol,
    date,
    time,
    open: parsedOpen,
    close: parsedClose,
  };
};

const fetchEquityQuote = async (symbol: string): Promise<MarketQuote> => {
  const sourceSymbol = `${symbol.toLowerCase()}.us`;
  const csv = await fetchText(`https://stooq.com/q/l/?s=${sourceSymbol}&f=sd2t2ohlcv&h&e=csv`);
  const row = parseStooqCsv(csv);
  if (!row) throw new Error(`No quote returned for ${symbol}`);

  const changePercent =
    row.open && row.open !== 0 ? Number((((row.close ?? row.open) - row.open) / row.open * 100).toFixed(2)) : null;

  return {
    symbol,
    price: row.close ?? 0,
    changePercent,
    source: "stooq",
    sourceSymbol: row.symbol,
    asOf: row.date && row.time ? `${row.date}T${row.time}Z` : null,
  };
};

const fetchCryptoQuotes = async (): Promise<MarketQuote[]> => {
  const symbols = Object.keys(DEFAULT_CRYPTO_IDS);
  const ids = symbols.map((symbol) => DEFAULT_CRYPTO_IDS[symbol]).join(",");
  const payload = await fetchJson<Record<string, { usd?: number; usd_24h_change?: number }>>(
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
  );
  const pulledAt = new Date().toISOString();

  return symbols.flatMap((symbol) => {
    const data = payload[DEFAULT_CRYPTO_IDS[symbol]];
    if (typeof data?.usd !== "number") return [];
    return [
      {
        symbol,
        price: data.usd,
        changePercent: typeof data.usd_24h_change === "number" ? Number(data.usd_24h_change.toFixed(2)) : null,
        source: "coingecko" as const,
        sourceSymbol: DEFAULT_CRYPTO_IDS[symbol],
        asOf: pulledAt,
      },
    ];
  });
};

export const getMarketQuotes = async (): Promise<MarketQuotesResponse> => {
  if (cachedQuotes && cachedQuotes.expiresAt > Date.now()) return cachedQuotes.response;

  const errors: MarketQuotesResponse["errors"] = [];
  const quotes: MarketQuote[] = [];

  const equityResults = await Promise.allSettled(DEFAULT_EQUITY_SYMBOLS.map(fetchEquityQuote));
  for (const [index, result] of equityResults.entries()) {
    if (result.status === "fulfilled") quotes.push(result.value);
    else errors.push({ source: DEFAULT_EQUITY_SYMBOLS[index], message: result.reason instanceof Error ? result.reason.message : String(result.reason) });
  }

  try {
    quotes.push(...await fetchCryptoQuotes());
  } catch (error) {
    errors.push({ source: "CoinGecko", message: error instanceof Error ? error.message : String(error) });
  }

  const response: MarketQuotesResponse = {
    status: quotes.length > 0 && errors.length === 0 ? "ok" : quotes.length > 0 ? "partial" : "error",
    message:
      quotes.length > 0
        ? `${quotes.length} real market quote(s) loaded.`
        : "Market ticker unavailable: public quote sources failed.",
    quotes,
    errors,
    pulledAt: new Date().toISOString(),
  };

  cachedQuotes = { expiresAt: Date.now() + 60_000, response };
  return response;
};
