import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMasterTourClient } from '../../src/api/client.js';
import type { OAuthClient } from '../../src/auth/oauth.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

import axios from 'axios';

describe('MasterTourClient', () => {
  const mockOAuthClient: OAuthClient = {
    signRequest: vi.fn().mockReturnValue({ Authorization: 'OAuth mock-signature' }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { success: true, data: {} },
    });
  });

  describe('URL construction', () => {
    it('uses correct base URL with /portal/ prefix', async () => {
      const client = createMasterTourClient(mockOAuthClient);
      await client.getDay('test-day-id');

      expect(axios.get).toHaveBeenCalledWith(
        'https://my.eventric.com/portal/api/v5/day/test-day-id',
        expect.any(Object)
      );
    });
  });

  describe('version parameter', () => {
    it('always includes version=7 in params', async () => {
      const client = createMasterTourClient(mockOAuthClient);
      await client.getDay('test-day-id');

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({ version: '7' }),
        })
      );
    });
  });

  describe('OAuth integration', () => {
    it('passes OAuth headers to axios', async () => {
      const client = createMasterTourClient(mockOAuthClient);
      await client.getDay('test-day-id');

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'OAuth mock-signature' }),
        })
      );
    });

    it('signs request with correct URL and params', async () => {
      const client = createMasterTourClient(mockOAuthClient);
      await client.getDay('test-day-id');

      expect(mockOAuthClient.signRequest).toHaveBeenCalledWith(
        'https://my.eventric.com/portal/api/v5/day/test-day-id',
        'GET',
        { version: '7' }
      );
    });
  });

  describe('getDay', () => {
    it('hits /day/{dayId} endpoint', async () => {
      const client = createMasterTourClient(mockOAuthClient);
      await client.getDay('abc123');

      expect(axios.get).toHaveBeenCalledWith(
        'https://my.eventric.com/portal/api/v5/day/abc123',
        expect.any(Object)
      );
    });

    it('returns day data from response', async () => {
      const mockDay = { id: 'abc123', name: 'Test Day' };
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: { day: mockDay } },
      });

      const client = createMasterTourClient(mockOAuthClient);
      const result = await client.getDay('abc123');

      expect(result).toEqual({ day: mockDay });
    });
  });

  describe('getTourSummary', () => {
    it('hits /tour/{tourId}/summary/{date} endpoint', async () => {
      const client = createMasterTourClient(mockOAuthClient);
      await client.getTourSummary('tour123', '2026-01-03');

      expect(axios.get).toHaveBeenCalledWith(
        'https://my.eventric.com/portal/api/v5/tour/tour123/summary/2026-01-03',
        expect.any(Object)
      );
    });

    it('returns summary data from response', async () => {
      const mockSummary = [{ id: 'day1', dayDate: '2026-01-03' }];
      (axios.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { success: true, data: mockSummary },
      });

      const client = createMasterTourClient(mockOAuthClient);
      const result = await client.getTourSummary('tour123', '2026-01-03');

      expect(result).toEqual(mockSummary);
    });
  });
});
