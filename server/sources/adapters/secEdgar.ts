import { fetchJson } from "../fetchHelpers.js";
import { truncate, withIngestedAt } from "../normalize.js";
import type { NormalizedIngestedItem, SourceAdapter } from "../types.js";

type SecSubmissions = {
  name?: string;
  tickers?: string[];
  cik?: string;
  filings?: {
    recent?: {
      accessionNumber?: string[];
      filingDate?: string[];
      reportDate?: string[];
      form?: string[];
      primaryDocument?: string[];
      primaryDocDescription?: string[];
    };
  };
};

const USER_AGENT = process.env.SEC_USER_AGENT ?? "TRND_FLWR/0.1 contact@example.com";
const allowedForms = new Set(["8-K", "10-K", "10-Q", "4", "13F-HR", "SC 13D", "SC 13G"]);
const watchlist = [
  { ticker: "AAPL", cik: "0000320193" },
  { ticker: "MSFT", cik: "0000789019" },
  { ticker: "NVDA", cik: "0001045810" },
  { ticker: "TSLA", cik: "0001318605" },
  { ticker: "META", cik: "0001326801" },
  { ticker: "AMZN", cik: "0001018724" },
  { ticker: "COIN", cik: "0001679788" },
  { ticker: "MSTR", cik: "0001050446" },
];

const fetchSubmission = async (cik: string) => {
  return fetchJson<SecSubmissions>(`https://data.sec.gov/submissions/CIK${cik}.json`, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Encoding": "gzip, deflate",
    },
  }).catch((error: unknown) => {
    throw new Error(`SEC submissions request failed for ${cik}: ${error instanceof Error ? error.message : String(error)}`);
  });
};

const filingUrl = (cik: string, accessionNumber: string, primaryDocument: string) => {
  const cikNoZeros = String(Number(cik));
  const accessionNoDashes = accessionNumber.replace(/-/g, "");
  return `https://www.sec.gov/Archives/edgar/data/${cikNoZeros}/${accessionNoDashes}/${primaryDocument}`;
};

export const secEdgarAdapter: SourceAdapter = {
  id: "sec_edgar",
  name: "SEC EDGAR",
  category: "institutional",
  url: "https://data.sec.gov/",
  enabledByDefault: true,
  requiresApiKey: false,
  paidRequired: false,
  connectionType: "public_api",
  docsUrl: "https://www.sec.gov/edgar",
  async healthCheck() {
    await fetchSubmission(watchlist[0].cik);
    return { ok: true, status: "connected" };
  },
  async fetchLatest(): Promise<NormalizedIngestedItem[]> {
    const submissions = await Promise.all(watchlist.map(async (company) => ({ company, data: await fetchSubmission(company.cik) })));

    return submissions.flatMap(({ company, data }) => {
      const recent = data.filings?.recent;
      if (!recent) return [];
      return (recent.accessionNumber ?? [])
        .map((accessionNumber, index) => {
          const form = recent.form?.[index];
          const primaryDocument = recent.primaryDocument?.[index];
          if (!form || !primaryDocument || !allowedForms.has(form)) return null;
          const title = `${company.ticker} ${form} filing - ${data.name ?? "SEC company"}`;
          const url = filingUrl(company.cik, accessionNumber, primaryDocument);
          return withIngestedAt({
            source: "SEC EDGAR",
            sourceId: "sec_edgar",
            sourceCategory: "institutional",
            sourceStatus: "connected",
            externalId: accessionNumber,
            title,
            summary: truncate(
              [
                data.name,
                `CIK: ${company.cik}`,
                `Form: ${form}`,
                recent.primaryDocDescription?.[index],
              ]
                .filter(Boolean)
                .join(" | "),
            ),
            url,
            imageUrl: null,
            symbol: company.ticker,
            assetClass: "stock",
            signalType: form === "4" ? "insider_trade" : "institutional_filing",
            direction: "unknown",
            confidence: null,
            importance: form === "8-K" || form === "4" ? "medium" : "low",
            publishedAt: recent.filingDate?.[index] ? `${recent.filingDate[index]}T00:00:00Z` : null,
            raw: {
              cik: company.cik,
              ticker: company.ticker,
              companyName: data.name,
              accessionNumber,
              form,
              filingDate: recent.filingDate?.[index],
              reportDate: recent.reportDate?.[index],
              primaryDocument,
            },
          });
        })
        .filter((item): item is NormalizedIngestedItem => Boolean(item))
        .slice(0, 8);
    });
  },
};
