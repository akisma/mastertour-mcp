import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTourHotels } from '../../src/tools/getTourHotels.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getTourHotels', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      listTours: vi.fn(),
      getDay: vi.fn(),
      getTourSummary: vi.fn(),
      createScheduleItem: vi.fn(),
      updateScheduleItem: vi.fn(),
      deleteScheduleItem: vi.fn(),
      updateDayNotes: vi.fn(),
      getTourHotels: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('returns formatted hotel info for tour days', async () => {
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
          city: 'New York',
          state: 'NY',
          hotelNotes: 'Hilton Times Square - Confirmation #12345',
          hotels: [
            {
              id: 'hotel-1',
              name: 'Hilton Times Square',
              address: '234 W 42nd St',
              city: 'New York',
              checkIn: '2024-06-14',
              checkOut: '2024-06-16',
            },
          ],
        },
      ],
    };

    (mockClient.getTourHotels as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getTourHotels(mockClient, { tourId: 'tour-123' });

    expect(mockClient.getTourHotels).toHaveBeenCalledWith('tour-123');
    expect(result).toContain('Test Band');
    expect(result).toContain('Summer 2024');
    expect(result).toContain('Hilton Times Square');
    expect(result).toContain('New York');
  });

  it('shows hotel notes when no hotel objects exist', async () => {
    const mockData = {
      tour: {
        artistName: 'Test Band',
        legName: 'Tour 2024',
      },
      days: [
        {
          id: 'day-1',
          name: 'Venue Name',
          dayDate: '2024-06-15 00:00:00',
          city: 'Chicago',
          state: 'IL',
          hotelNotes: 'Staying at The Palmer House - Room block under "Test Band"',
          hotels: [],
        },
      ],
    };

    (mockClient.getTourHotels as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getTourHotels(mockClient, { tourId: 'tour-123' });

    expect(result).toContain('Palmer House');
    expect(result).toContain('Room block');
  });

  it('returns message when no hotel data exists', async () => {
    const mockData = {
      tour: {
        artistName: 'Test Band',
        legName: 'Tour 2024',
      },
      days: [
        {
          id: 'day-1',
          name: 'Venue',
          dayDate: '2024-06-15 00:00:00',
          city: 'Austin',
          state: 'TX',
          hotelNotes: '',
          hotels: [],
        },
      ],
    };

    (mockClient.getTourHotels as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getTourHotels(mockClient, { tourId: 'tour-123' });

    expect(result).toContain('No hotel information');
  });

  it('throws error when no tour ID provided', async () => {
    await expect(getTourHotels(mockClient, {})).rejects.toThrow(
      'Tour ID is required'
    );
  });
});
