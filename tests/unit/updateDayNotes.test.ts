import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateDayNotes } from '../../src/tools/updateDayNotes.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('updateDayNotes', () => {
  const mockClient = {
    getDay: vi.fn(),
    getTourSummary: vi.fn(),
    createScheduleItem: vi.fn(),
    updateScheduleItem: vi.fn(),
    deleteScheduleItem: vi.fn(),
    updateDayNotes: vi.fn(),
  } as unknown as MasterTourClient & {
    getDay: ReturnType<typeof vi.fn>;
    updateDayNotes: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient.getDay.mockResolvedValue({
      day: {
        id: 'day123',
        dayDate: '2026-01-04 00:00:00',
        city: 'Los Angeles',
        generalNotes: 'Existing general notes',
        hotelNotes: 'Existing hotel notes',
        travelNotes: 'Existing travel notes',
        syncId: '1',
      },
    });
    mockClient.updateDayNotes.mockResolvedValue(undefined);
  });

  describe('input validation', () => {
    it('throws error if dayId is missing', async () => {
      await expect(
        updateDayNotes(mockClient, {
          generalNotes: 'Some notes',
        })
      ).rejects.toThrow('dayId');
    });

    it('throws error if no notes fields provided', async () => {
      await expect(
        updateDayNotes(mockClient, {
          dayId: 'day123',
        })
      ).rejects.toThrow('note field');
    });
  });

  describe('API call', () => {
    it('updates only generalNotes when provided', async () => {
      await updateDayNotes(mockClient, {
        dayId: 'day123',
        generalNotes: 'New general notes',
      });

      expect(mockClient.updateDayNotes).toHaveBeenCalledWith('day123', {
        generalNotes: 'New general notes',
        hotelNotes: 'Existing hotel notes',
        travelNotes: 'Existing travel notes',
        syncId: '1',
      });
    });

    it('updates only hotelNotes when provided', async () => {
      await updateDayNotes(mockClient, {
        dayId: 'day123',
        hotelNotes: 'New hotel notes',
      });

      expect(mockClient.updateDayNotes).toHaveBeenCalledWith('day123', {
        generalNotes: 'Existing general notes',
        hotelNotes: 'New hotel notes',
        travelNotes: 'Existing travel notes',
        syncId: '1',
      });
    });

    it('updates only travelNotes when provided', async () => {
      await updateDayNotes(mockClient, {
        dayId: 'day123',
        travelNotes: 'New travel notes',
      });

      expect(mockClient.updateDayNotes).toHaveBeenCalledWith('day123', {
        generalNotes: 'Existing general notes',
        hotelNotes: 'Existing hotel notes',
        travelNotes: 'New travel notes',
        syncId: '1',
      });
    });

    it('updates multiple note fields at once', async () => {
      await updateDayNotes(mockClient, {
        dayId: 'day123',
        generalNotes: 'New general',
        hotelNotes: 'New hotel',
      });

      expect(mockClient.updateDayNotes).toHaveBeenCalledWith('day123', {
        generalNotes: 'New general',
        hotelNotes: 'New hotel',
        travelNotes: 'Existing travel notes',
        syncId: '1',
      });
    });

    it('can clear a note field with empty string', async () => {
      await updateDayNotes(mockClient, {
        dayId: 'day123',
        generalNotes: '',
      });

      expect(mockClient.updateDayNotes).toHaveBeenCalledWith('day123', {
        generalNotes: '',
        hotelNotes: 'Existing hotel notes',
        travelNotes: 'Existing travel notes',
        syncId: '1',
      });
    });
  });

  describe('response formatting', () => {
    it('returns success message with city name', async () => {
      const result = await updateDayNotes(mockClient, {
        dayId: 'day123',
        generalNotes: 'Some notes',
      });

      expect(result).toContain('Los Angeles');
      expect(result).toContain('updated');
    });
  });
});
