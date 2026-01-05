import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTourEvents } from '../../src/tools/getTourEvents.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getTourEvents', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      listTours: vi.fn(),
      getDay: vi.fn(),
      getTourSummary: vi.fn(),
      getTourHotels: vi.fn(),
      getTourCrew: vi.fn(),
      getTourEvents: vi.fn(),
      createScheduleItem: vi.fn(),
      updateScheduleItem: vi.fn(),
      deleteScheduleItem: vi.fn(),
      updateDayNotes: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('returns formatted list of tour dates', async () => {
    const mockData = {
      tour: {
        artistName: 'Test Band',
        legName: 'Summer 2024',
      },
      days: [
        {
          id: 'day-1',
          name: 'Madison Square Garden',
          dayDate: '2024-06-15 00:00:00',
          dayType: 'Show Day',
          city: 'New York',
          state: 'NY',
          country: 'US',
        },
        {
          id: 'day-2',
          name: 'TD Garden',
          dayDate: '2024-06-16 00:00:00',
          dayType: 'Show Day',
          city: 'Boston',
          state: 'MA',
          country: 'US',
        },
      ],
    };

    (mockClient.getTourEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getTourEvents(mockClient, { tourId: 'tour-123' });

    expect(mockClient.getTourEvents).toHaveBeenCalledWith('tour-123');
    expect(result.text).toContain('Test Band');
    expect(result.text).toContain('Summer 2024');
    expect(result.text).toContain('Madison Square Garden');
    expect(result.text).toContain('New York');
    expect(result.text).toContain('Show Day');
  });

  it('filters to show days only when showOnly is true', async () => {
    const mockData = {
      tour: {
        artistName: 'Test Band',
        legName: 'Tour',
      },
      days: [
        {
          id: 'day-1',
          name: 'Venue',
          dayDate: '2024-06-15 00:00:00',
          dayType: 'Show Day',
          city: 'City',
          state: 'ST',
          country: 'US',
        },
        {
          id: 'day-2',
          name: '',
          dayDate: '2024-06-16 00:00:00',
          dayType: 'Day Off',
          city: 'City',
          state: 'ST',
          country: 'US',
        },
        {
          id: 'day-3',
          name: '',
          dayDate: '2024-06-17 00:00:00',
          dayType: 'Travel',
          city: 'City',
          state: 'ST',
          country: 'US',
        },
      ],
    };

    (mockClient.getTourEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getTourEvents(mockClient, { tourId: 'tour-123', showsOnly: true });

    expect(result.text).toContain('Show Day');
    expect(result.text).not.toContain('Day Off');
    expect(result.text).not.toContain('Travel');
  });

  it('includes day ID for each event', async () => {
    const mockData = {
      tour: { artistName: 'Band', legName: 'Tour' },
      days: [
        {
          id: 'day-abc-123',
          name: 'Venue',
          dayDate: '2024-06-15 00:00:00',
          dayType: 'Show Day',
          city: 'City',
          state: 'ST',
          country: 'US',
        },
      ],
    };

    (mockClient.getTourEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getTourEvents(mockClient, { tourId: 'tour-123' });

    expect(result.text).toContain('day-abc-123');
  });

  it('returns message when no events exist', async () => {
    const mockData = {
      tour: { artistName: 'Band', legName: 'Tour' },
      days: [],
    };

    (mockClient.getTourEvents as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getTourEvents(mockClient, { tourId: 'tour-123' });

    expect(result.text).toContain('No events found');
  });

  it('throws error when no tour ID provided', async () => {
    await expect(getTourEvents(mockClient, {})).rejects.toThrow(
      'Tour ID is required'
    );
  });
});
