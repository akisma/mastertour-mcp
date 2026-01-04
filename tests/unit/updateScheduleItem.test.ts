import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateScheduleItem } from '../../src/tools/updateScheduleItem.js';
import type { MasterTourClient } from '../../src/api/client.js';

describe('updateScheduleItem', () => {
  const mockClient = {
    getDay: vi.fn(),
    getTourSummary: vi.fn(),
    createScheduleItem: vi.fn(),
    updateScheduleItem: vi.fn(),
    deleteScheduleItem: vi.fn(),
  } as unknown as MasterTourClient & {
    getDay: ReturnType<typeof vi.fn>;
    updateScheduleItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getDay to return day info with timezone
    mockClient.getDay.mockResolvedValue({
      day: {
        dayDate: '2026-01-04 00:00:00',
        timeZone: 'America/Los_Angeles',
        scheduleItems: [
          {
            id: 'item123',
            title: 'Existing Item',
            details: 'Original details',
            paulStartTime: '2026-01-04 09:00:00',
            paulEndTime: '2026-01-04 10:00:00',
            isConfirmed: false,
            isComplete: false,
            syncId: '1',
          },
        ],
      },
    });
    mockClient.updateScheduleItem.mockResolvedValue(undefined);
  });

  describe('input validation', () => {
    it('throws error if itemId is missing', async () => {
      await expect(
        updateScheduleItem(mockClient, {
          dayId: 'day123',
          title: 'New title',
        })
      ).rejects.toThrow('itemId');
    });

    it('throws error if dayId is missing', async () => {
      await expect(
        updateScheduleItem(mockClient, {
          itemId: 'item123',
          title: 'New title',
        })
      ).rejects.toThrow('dayId');
    });

    it('throws error if no update fields provided', async () => {
      await expect(
        updateScheduleItem(mockClient, {
          itemId: 'item123',
          dayId: 'day123',
        })
      ).rejects.toThrow('update field');
    });
  });

  describe('API call', () => {
    it('fetches the day to get current item values', async () => {
      await updateScheduleItem(mockClient, {
        itemId: 'item123',
        dayId: 'day123',
        title: 'Updated Title',
      });

      expect(mockClient.getDay).toHaveBeenCalledWith('day123');
    });

    it('preserves existing values when only title is updated', async () => {
      await updateScheduleItem(mockClient, {
        itemId: 'item123',
        dayId: 'day123',
        title: 'Updated Title',
      });

      expect(mockClient.updateScheduleItem).toHaveBeenCalledWith('item123', {
        title: 'Updated Title',
        details: 'Original details', // preserved
        isConfirmed: false,
        isComplete: false,
        timePriority: '',
        syncId: '1',
        startDatetime: expect.stringContaining('17:00:00'), // 09:00 LA = 17:00 UTC
        endDatetime: expect.stringContaining('18:00:00'), // 10:00 LA = 18:00 UTC
      });
    });

    it('converts local time to UTC when updating times', async () => {
      await updateScheduleItem(mockClient, {
        itemId: 'item123',
        dayId: 'day123',
        startTime: '14:00',
        endTime: '15:00',
      });

      // LA is UTC-8, so 14:00 LA = 22:00 UTC
      expect(mockClient.updateScheduleItem).toHaveBeenCalledWith('item123',
        expect.objectContaining({
          startDatetime: '2026-01-04 22:00:00',
          endDatetime: '2026-01-04 23:00:00',
        })
      );
    });

    it('updates only startTime if endTime not provided', async () => {
      await updateScheduleItem(mockClient, {
        itemId: 'item123',
        dayId: 'day123',
        startTime: '11:00',
      });

      // 11:00 LA = 19:00 UTC, endTime preserved (10:00 LA = 18:00 UTC)
      expect(mockClient.updateScheduleItem).toHaveBeenCalledWith('item123',
        expect.objectContaining({
          startDatetime: '2026-01-04 19:00:00',
          endDatetime: '2026-01-04 18:00:00', // original endTime preserved
        })
      );
    });

    it('updates details without affecting other fields', async () => {
      await updateScheduleItem(mockClient, {
        itemId: 'item123',
        dayId: 'day123',
        details: 'New details text',
      });

      expect(mockClient.updateScheduleItem).toHaveBeenCalledWith('item123',
        expect.objectContaining({
          title: 'Existing Item', // preserved
          details: 'New details text',
        })
      );
    });

    it('throws error if item not found in day', async () => {
      await expect(
        updateScheduleItem(mockClient, {
          itemId: 'nonexistent',
          dayId: 'day123',
          title: 'New title',
        })
      ).rejects.toThrow('not found');
    });
  });

  describe('response formatting', () => {
    it('returns success message with item title', async () => {
      const result = await updateScheduleItem(mockClient, {
        itemId: 'item123',
        dayId: 'day123',
        title: 'Updated Title',
      });

      expect(result).toContain('Updated Title');
      expect(result).toContain('updated');
    });
  });
});
