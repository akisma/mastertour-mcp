import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

export interface OAuthClient {
  signRequest(url: string, method: string, params?: Record<string, string>): { Authorization: string };
}

export function createOAuthClient(): OAuthClient {
  const key = process.env.MASTERTOUR_KEY;
  const secret = process.env.MASTERTOUR_SECRET;

  if (!key) {
    throw new Error('MASTERTOUR_KEY environment variable is required');
  }
  if (!secret) {
    throw new Error('MASTERTOUR_SECRET environment variable is required');
  }

  const oauth = new OAuth({
    consumer: { key, secret },
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
