import type { WalletWeatherSignal, WalletProfile, WalletWeatherSummary } from "./types";

export async function fetchWalletWeatherSummary(): Promise<WalletWeatherSummary> {
  return {
    activeMarketsWatched: 0,
    walletsTracked: 0,
    unusualActivityFlags: 0,
    highRiskSignals: 0,
    lastUpdated: new Date(0).toISOString(),
  };
}

export async function fetchWalletWeatherSignals(): Promise<WalletWeatherSignal[]> {
  return [];
}

export async function fetchWalletProfiles(): Promise<WalletProfile[]> {
  return [];
}
