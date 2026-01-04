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

  describe('createOAuthClient', () => {
    it('throws error if MASTERTOUR_KEY is missing', async () => {
      delete process.env.MASTERTOUR_KEY;
      process.env.MASTERTOUR_SECRET = 'test-secret';

      const { createOAuthClient } = await import('../../src/auth/oauth.js');
      expect(() => createOAuthClient()).toThrow('MASTERTOUR_KEY');
    });

    it('throws error if MASTERTOUR_SECRET is missing', async () => {
      process.env.MASTERTOUR_KEY = 'test-key';
      delete process.env.MASTERTOUR_SECRET;

      const { createOAuthClient } = await import('../../src/auth/oauth.js');
      expect(() => createOAuthClient()).toThrow('MASTERTOUR_SECRET');
    });
  });

  describe('signRequest', () => {
    it('returns an object with Authorization header', async () => {
      process.env.MASTERTOUR_KEY = 'test-key';
      process.env.MASTERTOUR_SECRET = 'test-secret';

      const { createOAuthClient } = await import('../../src/auth/oauth.js');
      const client = createOAuthClient();
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
