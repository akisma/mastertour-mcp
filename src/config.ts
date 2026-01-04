/**
 * Configuration module for Mastertour MCP Server
 *
 * Centralizes environment variables and provides validated access.
 * Fails fast on missing required credentials at startup.
 */

export interface Config {
  /** Master Tour API consumer key */
  consumerKey: string;
  /** Master Tour API consumer secret */
  consumerSecret: string;
  /** Default tour ID (optional) */
  defaultTourId?: string;
}

/**
 * Validates and returns configuration from environment variables.
 * Throws descriptive errors if required values are missing.
 */
export function loadConfig(): Config {
  const consumerKey = process.env.MASTERTOUR_KEY;
  const consumerSecret = process.env.MASTERTOUR_SECRET;
  const defaultTourId = process.env.MASTERTOUR_DEFAULT_TOUR_ID;

  const missing: string[] = [];
  if (!consumerKey) missing.push('MASTERTOUR_KEY');
  if (!consumerSecret) missing.push('MASTERTOUR_SECRET');

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      'Set these in your .env file or environment.'
    );
  }

  return {
    consumerKey: consumerKey!,
    consumerSecret: consumerSecret!,
    defaultTourId: defaultTourId || undefined,
  };
}

/**
 * Resolves tour ID from input or config default.
 * Throws if neither is available.
 */
export function resolveTourId(inputTourId: string | undefined, config: Config): string {
  const tourId = inputTourId || config.defaultTourId;
  if (!tourId) {
    throw new Error(
      'tourId is required. Provide it as input or set MASTERTOUR_DEFAULT_TOUR_ID environment variable.'
    );
  }
  return tourId;
}
