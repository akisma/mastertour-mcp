import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addScheduleItem } from '../../src/tools/addScheduleItem.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('addScheduleItem', () => {
  const mockClient = {
    getDay: vi.fn(),
    getTourSummary: vi.fn(),
    createScheduleItem: vi.fn(),
  } as unknown as MasterTourClient & { 
    getDay: ReturnType<typeof vi.fn>;
    createScheduleItem: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getDay to return a day with timezone info
    mockClient.getDay.mockResolvedValue({
      day: {
        dayDate: '2026-01-04 00:00:00',
        timeZone: 'America/Los_Angeles',
      }
    });
    mockClient.createScheduleItem.mockResolvedValue({ id: 'new-item-123' });
  });

  describe('input validation', () => {
    it('throws error if dayId is missing', async () => {
      await expect(
        addScheduleItem(mockClient, {
          title: 'Production meeting',
          startTime: '14:00',
        })
      ).rejects.toThrow('dayId');
    });

    it('throws error if title is missing', async () => {
      await expect(
        addScheduleItem(mockClient, {
          dayId: 'day123',
          startTime: '14:00',
        })
      ).rejects.toThrow('title');
    });

    it('throws error if startTime is missing', async () => {
      await expect(
        addScheduleItem(mockClient, {
          dayId: 'day123',
          title: 'Production meeting',
        })
      ).rejects.toThrow('startTime');
    });
  });

  describe('API call', () => {
    it('fetches the day to get timezone and date', async () => {
      await addScheduleItem(mockClient, {
        dayId: 'day123',
        title: 'Production meeting',
        startTime: '14:00',
      });

      expect(mockClient.getDay).toHaveBeenCalledWith('day123');
    });

    it('converts local time to UTC for API (LA 14:00 → UTC 22:00)', async () => {
      await addScheduleItem(mockClient, {
        dayId: 'day123',
        title: 'Production meeting',
        startTime: '14:00',
        endTime: '15:00',
        details: 'In green room',
      });

      // LA is UTC-8, so 14:00 LA = 22:00 UTC
      expect(mockClient.createScheduleItem).toHaveBeenCalledWith({
        parentDayId: 'day123',
        title: 'Production meeting',
        startDatetime: '2026-01-04 22:00:00',
        endDatetime: '2026-01-04 23:00:00',
        details: 'In green room',
        isConfirmed: false,
        isComplete: false,
        timePriority: '',
      });
    });

    it('uses startTime as endTime if endTime not provided', async () => {
      await addScheduleItem(mockClient, {
        dayId: 'day123',
        title: 'Lobby call',
        startTime: '09:00',
      });

      expect(mockClient.createScheduleItem).toHaveBeenCalledWith(
        expect.objectContaining({
          startDatetime: expect.stringContaining('17:00:00'), // 09:00 LA = 17:00 UTC
          endDatetime: expect.stringContaining('17:00:00'),
        })
      );
    });

    it('defaults details to empty string', async () => {
      await addScheduleItem(mockClient, {
        dayId: 'day123',
        title: 'Lobby call',
        startTime: '09:00',
      });

      expect(mockClient.createScheduleItem).toHaveBeenCalledWith(
        expect.objectContaining({
          details: '',
        })
      );
    });
  });

  describe('response formatting', () => {
    it('returns success message with item title and local time', async () => {
      const result = await addScheduleItem(mockClient, {
        dayId: 'day123',
        title: 'Production meeting',
        startTime: '14:00',
      });

      expect(result).toContain('Production meeting');
      expect(result).toContain('added');
      expect(result).toContain('14:00'); // Should show local time user requested
    });
  });
});
