export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const withTimeout = async <T>(operation: Promise<T>, ms: number, message = "Request timed out") => {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), ms);
  });

  try {
    return await Promise.race([operation, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
};

export const fetchText = async (url: string, options: RequestInit = {}, timeoutMs = 8_000) =>
  withTimeout(
    fetch(url, {
      ...options,
      headers: {
        "User-Agent": "TRND_FLWR/0.1",
        ...(options.headers ?? {}),
      },
    }).then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.text();
    }),
    timeoutMs,
    `Timed out fetching ${url}`,
  );

export const fetchJson = async <T>(url: string, options: RequestInit = {}, timeoutMs = 8_000) =>
  withTimeout(
    fetch(url, {
      ...options,
      headers: {
        "User-Agent": "TRND_FLWR/0.1",
        Accept: "application/json",
        ...(options.headers ?? {}),
      },
    }).then(async (response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return (await response.json()) as T;
    }),
    timeoutMs,
    `Timed out fetching ${url}`,
  );

export const safeNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const normalizeTimestamp = (value: unknown) => {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};
