import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('OAuth Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('createOAuthClientFromEnv', () => {
    it('throws error if MASTERTOUR_KEY is missing', async () => {
      delete process.env.MASTERTOUR_KEY;
      process.env.MASTERTOUR_SECRET = 'test-secret';

      const { createOAuthClientFromEnv } = await import('../../src/auth/oauth.ts');
      expect(() => createOAuthClientFromEnv()).toThrow('MASTERTOUR_KEY');
    });

    it('throws error if MASTERTOUR_SECRET is missing', async () => {
      process.env.MASTERTOUR_KEY = 'test-key';
      delete process.env.MASTERTOUR_SECRET;

      const { createOAuthClientFromEnv } = await import('../../src/auth/oauth.ts');
      expect(() => createOAuthClientFromEnv()).toThrow('MASTERTOUR_SECRET');
    });
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
