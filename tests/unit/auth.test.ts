import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('OAuth Module', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('createOAuthClient', () => {
    it('creates client with provided credentials', async () => {
      const { createOAuthClient } = await import('../../src/auth/oauth.ts');
      const client = createOAuthClient({
        consumerKey: 'test-key',
        consumerSecret: 'test-secret',
      });
      
      expect(client).toBeDefined();
      expect(typeof client.signRequest).toBe('function');
    });
  });

  describe('signRequest', () => {
    it('returns an object with Authorization header', async () => {
      const { createOAuthClient } = await import('../../src/auth/oauth.ts');
      const client = createOAuthClient({
        consumerKey: 'test-key',
        consumerSecret: 'test-secret',
      });
      const headers = client.signRequest(
        'https://example.com/api',
        'GET',
        { version: '7' }
      );

      expect(headers).toHaveProperty('Authorization');
      expect(typeof headers.Authorization).toBe('string');
      expect(headers.Authorization).toContain('OAuth');
    });
  });
});
