import OAuth from 'oauth-1.0a';
import crypto from 'crypto';
import type { Config } from '../config.js';

export interface OAuthClient {
  signRequest(url: string, method: string, params?: Record<string, string>): { Authorization: string };
}

export interface OAuthCredentials {
  consumerKey: string;
  consumerSecret: string;
}

/**
 * Creates an OAuth client with provided credentials.
 */
export function createOAuthClient(credentials: OAuthCredentials): OAuthClient {
  const oauth = new OAuth({
    consumer: { key: credentials.consumerKey, secret: credentials.consumerSecret },
    signature_method: 'HMAC-SHA1',
    hash_function(baseString: string, signingKey: string): string {
      return crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');
    },
  });

  return {
    signRequest(url: string, method: string, params?: Record<string, string>): { Authorization: string } {
      const requestData = {
        url,
        method,
        data: params,
      };
      return oauth.toHeader(oauth.authorize(requestData)) as { Authorization: string };
    },
  };
}

/**
 * Creates an OAuth client from a Config object.
 */
export function createOAuthClientFromConfig(config: Config): OAuthClient {
  return createOAuthClient({
    consumerKey: config.consumerKey,
    consumerSecret: config.consumerSecret,
  });
}
