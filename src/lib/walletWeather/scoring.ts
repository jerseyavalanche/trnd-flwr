

/**
 * Calculate confidence score based on transparent rules:
 * - +20 for multiple wallets involved
 * - +15 for repeated behavior across markets
 * - +15 for meaningful liquidity
 * - +20 for early entries before price movement
 * - +30 for consistent historical behavior
 */
export function calculateConfidence(params: {
  multipleWallets: boolean;
  repeatedBehavior: boolean;
  meaningfulLiquidity: boolean;
  earlyEntries: boolean;
  consistentHistory: boolean;
}): number {
  let score = 0;
  if (params.multipleWallets) score += 20;
  if (params.repeatedBehavior) score += 15;
  if (params.meaningfulLiquidity) score += 15;
  if (params.earlyEntries) score += 20;
  if (params.consistentHistory) score += 30;
  return Math.min(100, score);
}

/**
 * Calculate risk score based on transparent rules:
 * - +25 for thin liquidity
 * - +25 for one wallet dominating
 * - +20 for tiny sample size
 * - +15 for sudden crowding
 * - +15 for unclear market resolution
 */
export function calculateRisk(params: {
  thinLiquidity: boolean;
  oneWalletDominating: boolean;
  tinySampleSize: boolean;
  suddenCrowding: boolean;
  unclearResolution: boolean;
}): number {
  let score = 0;
  if (params.thinLiquidity) score += 25;
  if (params.oneWalletDominating) score += 25;
  if (params.tinySampleSize) score += 20;
  if (params.suddenCrowding) score += 15;
  if (params.unclearResolution) score += 15;
  return Math.min(100, score);
}

/**
 * Get a human-readable label for confidence score
 */
export function getConfidenceLabel(score: number): string {
  if (score >= 80) return "High";
  if (score >= 50) return "Medium";
  return "Low";
}

/**
 * Get a human-readable label for risk score
 */
export function getRiskLabel(score: number): string {
  if (score >= 70) return "High";
  if (score >= 40) return "Medium";
  return "Low";
}
