/**
 * Unit tests for configuration module
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfig, resolveTourId, type Config } from '../../src/config.ts';

describe('loadConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should load config from environment variables', () => {
    process.env.MASTERTOUR_KEY = 'test-key';
    process.env.MASTERTOUR_SECRET = 'test-secret';
    process.env.MASTERTOUR_DEFAULT_TOUR_ID = 'tour-123';

    const config = loadConfig();

    expect(config.consumerKey).toBe('test-key');
    expect(config.consumerSecret).toBe('test-secret');
    expect(config.defaultTourId).toBe('tour-123');
  });

  it('should make defaultTourId optional', () => {
    process.env.MASTERTOUR_KEY = 'test-key';
    process.env.MASTERTOUR_SECRET = 'test-secret';
    delete process.env.MASTERTOUR_DEFAULT_TOUR_ID;

    const config = loadConfig();

    expect(config.consumerKey).toBe('test-key');
    expect(config.consumerSecret).toBe('test-secret');
    expect(config.defaultTourId).toBeUndefined();
  });

  it('should throw error if MASTERTOUR_KEY is missing', () => {
    delete process.env.MASTERTOUR_KEY;
    process.env.MASTERTOUR_SECRET = 'test-secret';

    expect(() => loadConfig()).toThrow('Missing required environment variables: MASTERTOUR_KEY');
  });

  it('should throw error if MASTERTOUR_SECRET is missing', () => {
    process.env.MASTERTOUR_KEY = 'test-key';
    delete process.env.MASTERTOUR_SECRET;

    expect(() => loadConfig()).toThrow('Missing required environment variables: MASTERTOUR_SECRET');
  });

  it('should list all missing variables in error message', () => {
    delete process.env.MASTERTOUR_KEY;
    delete process.env.MASTERTOUR_SECRET;

    expect(() => loadConfig()).toThrow('Missing required environment variables: MASTERTOUR_KEY, MASTERTOUR_SECRET');
  });
});

describe('resolveTourId', () => {
  const mockConfig: Config = {
    consumerKey: 'key',
    consumerSecret: 'secret',
    defaultTourId: 'default-tour-123',
  };

  it('should use input tourId when provided', () => {
    const result = resolveTourId('input-tour-456', mockConfig);
    expect(result).toBe('input-tour-456');
  });

  it('should use config defaultTourId when input is undefined', () => {
    const result = resolveTourId(undefined, mockConfig);
    expect(result).toBe('default-tour-123');
  });

  it('should throw error when neither input nor default is available', () => {
    const configWithoutDefault: Config = {
      consumerKey: 'key',
      consumerSecret: 'secret',
    };

    expect(() => resolveTourId(undefined, configWithoutDefault)).toThrow(
      'tourId is required. Provide it as input or set MASTERTOUR_DEFAULT_TOUR_ID environment variable.'
    );
  });
});
