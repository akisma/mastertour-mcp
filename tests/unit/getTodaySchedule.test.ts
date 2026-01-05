import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTodaySchedule, formatSchedule } from '../../src/tools/getTodaySchedule.ts';
import type { MasterTourClient, DayResponse } from '../../src/api/client.ts';

describe('getTodaySchedule', () => {
  const originalEnv = process.env;

  const mockDayResponse: DayResponse = {
    day: {
      id: 'day123',
      tourId: 'tour123',
      name: 'Hollywood Forever',
      dayDate: '2026-02-06 00:00:00',
      timeZone: 'America/Los_Angeles',
      dayType: 'Show Day',
      city: 'Los Angeles',
      state: 'CA',
      country: 'US',
      scheduleItems: [
        {
          id: 'item1',
          syncId: 'sync1',
          title: 'venue access',
          startDatetime: '2026-02-06 20:00:00',
          paulStartTime: '2026-02-06 12:00:00',
          endDatetime: '2026-02-06 20:00:00',
          paulEndTime: '2026-02-06 12:00:00',
          dayTimeZone: 'America/Los_Angeles',
        },
        {
          id: 'item2',
          syncId: 'sync2',
          title: 'DOORS',
          startDatetime: '2026-02-07 02:30:00',
          paulStartTime: '2026-02-06 18:30:00',
          endDatetime: '2026-02-07 02:30:00',
          paulEndTime: '2026-02-06 18:30:00',
          dayTimeZone: 'America/Los_Angeles',
        },
      ],
    },
  };

  const mockClient = {
    getDay: vi.fn().mockResolvedValue(mockDayResponse),
    getTourSummary: vi.fn().mockResolvedValue([{ id: 'day123' }]),
  } as unknown as MasterTourClient;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('tourId resolution', () => {
    it('uses tourId from input if provided', async () => {
      await getTodaySchedule(mockClient, { tourId: 'input-tour-id', date: '2026-02-06' });

      expect(mockClient.getTourSummary).toHaveBeenCalledWith('input-tour-id', '2026-02-06');
    });

    it('throws error if no tourId available', async () => {
      await expect(getTodaySchedule(mockClient, { date: '2026-02-06' }))
        .rejects.toThrow('tourId');
    });
  });

  describe('date handling', () => {
    it('uses provided date', async () => {
      await getTodaySchedule(mockClient, { tourId: 'tour123', date: '2026-02-15' });

      expect(mockClient.getTourSummary).toHaveBeenCalledWith('tour123', '2026-02-15');
    });

    it('defaults to today if no date provided', async () => {
      const today = new Date().toISOString().split('T')[0];

      await getTodaySchedule(mockClient, { tourId: 'tour123' });

      expect(mockClient.getTourSummary).toHaveBeenCalledWith('tour123', today);
    });
  });;
});

describe('formatSchedule', () => {
  it('formats schedule items with local times from paulStartTime', () => {
    const day = {
      id: 'day123',
      tourId: 'tour123',
      name: 'Hollywood Forever',
      dayDate: '2026-02-06 00:00:00',
      timeZone: 'America/Los_Angeles',
      dayType: 'Show Day',
      city: 'Los Angeles',
      state: 'CA',
      country: 'US',
      scheduleItems: [
        {
          id: 'item1',
          syncId: 'sync1',
          title: 'venue access',
          startDatetime: '2026-02-06 20:00:00',
          paulStartTime: '2026-02-06 12:00:00',
          endDatetime: '2026-02-06 20:00:00',
          paulEndTime: '2026-02-06 12:00:00',
          dayTimeZone: 'America/Los_Angeles',
        },
      ],
    };

    const result = formatSchedule(day, 'day123');

    expect(result).toContain('Hollywood Forever');
    expect(result).toContain('Los Angeles, CA');
    expect(result).toContain('Show Day');
    expect(result).toContain('Day ID: day123');
    expect(result).toContain('12:00 PM');
    expect(result).toContain('venue access');
    expect(result).toContain('ID: item1');
  });

  it('handles empty schedule items', () => {
    const day = {
      id: 'day123',
      tourId: 'tour123',
      name: 'Travel Day',
      dayDate: '2026-02-07 00:00:00',
      timeZone: 'America/Los_Angeles',
      dayType: 'Travel Day',
      city: 'Phoenix',
      state: 'AZ',
      country: 'US',
      scheduleItems: [],
    };

    const result = formatSchedule(day, 'day456');

    expect(result).toContain('Travel Day');
    expect(result).toContain('No scheduled items');
    expect(result).toContain('Day ID: day456');
  });
});
