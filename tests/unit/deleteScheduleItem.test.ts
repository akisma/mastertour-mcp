import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteScheduleItem } from '../../src/tools/deleteScheduleItem.js';
import type { MasterTourClient } from '../../src/api/client.js';

describe('deleteScheduleItem', () => {
  const mockClient = {
    getDay: vi.fn(),
    getTourSummary: vi.fn(),
    createScheduleItem: vi.fn(),
    updateScheduleItem: vi.fn(),
    deleteScheduleItem: vi.fn(),
  } as unknown as MasterTourClient & {
    getDay: ReturnType<typeof vi.fn>;
    deleteScheduleItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getDay to return day info with schedule items
    mockClient.getDay.mockResolvedValue({
      day: {
        dayDate: '2026-01-04 00:00:00',
        timeZone: 'America/Los_Angeles',
        scheduleItems: [
          {
            id: 'item123',
            title: 'Item to Delete',
            paulStartTime: '2026-01-04 09:00:00',
          },
        ],
      },
    });
    mockClient.deleteScheduleItem.mockResolvedValue(undefined);
  });

  describe('input validation', () => {
    it('throws error if itemId is missing', async () => {
      await expect(
        deleteScheduleItem(mockClient, {
          dayId: 'day123',
        })
      ).rejects.toThrow('itemId');
    });

    it('throws error if dayId is missing', async () => {
      await expect(
        deleteScheduleItem(mockClient, {
          itemId: 'item123',
        })
      ).rejects.toThrow('dayId');
    });
  });

  describe('API call', () => {
    it('fetches the day to verify item exists and get title', async () => {
      await deleteScheduleItem(mockClient, {
        itemId: 'item123',
        dayId: 'day123',
      });

      expect(mockClient.getDay).toHaveBeenCalledWith('day123');
    });

    it('calls deleteScheduleItem with the item ID', async () => {
      await deleteScheduleItem(mockClient, {
        itemId: 'item123',
        dayId: 'day123',
      });

      expect(mockClient.deleteScheduleItem).toHaveBeenCalledWith('item123');
    });

    it('throws error if item not found in day', async () => {
      await expect(
        deleteScheduleItem(mockClient, {
          itemId: 'nonexistent',
          dayId: 'day123',
        })
      ).rejects.toThrow('not found');
    });
  });

  describe('response formatting', () => {
    it('returns success message with item title', async () => {
      const result = await deleteScheduleItem(mockClient, {
        itemId: 'item123',
        dayId: 'day123',
      });

      expect(result).toContain('Item to Delete');
      expect(result).toContain('deleted');
    });
  });
});
