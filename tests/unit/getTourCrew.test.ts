import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTourCrew } from '../../src/tools/getTourCrew.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getTourCrew', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      listTours: vi.fn(),
      getDay: vi.fn(),
      getTourSummary: vi.fn(),
      getTourHotels: vi.fn(),
      getTourCrew: vi.fn(),
      createScheduleItem: vi.fn(),
      updateScheduleItem: vi.fn(),
      deleteScheduleItem: vi.fn(),
      updateDayNotes: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('returns formatted crew list', async () => {
    const mockCrew = [
      {
        contactId: 'contact-1',
        firstName: 'John',
        lastName: 'Doe',
        preferredName: 'Johnny',
        title: 'Tour Manager',
        company: 'Touring Co',
        email: 'john@example.com',
        phone: '555-1234',
      },
      {
        contactId: 'contact-2',
        firstName: 'Jane',
        lastName: 'Smith',
        preferredName: '',
        title: 'FOH Engineer',
        company: 'Sound Inc',
        email: 'jane@example.com',
        phone: '',
      },
    ];

    (mockClient.getTourCrew as ReturnType<typeof vi.fn>).mockResolvedValue(mockCrew);

    const result = await getTourCrew(mockClient, { tourId: 'tour-123' });

    expect(mockClient.getTourCrew).toHaveBeenCalledWith('tour-123');
    expect(result).toContain('Johnny'); // Uses preferred name
    expect(result).toContain('Tour Manager');
    expect(result).toContain('john@example.com');
    expect(result).toContain('555-1234');
    expect(result).toContain('Jane Smith'); // Falls back to first + last
    expect(result).toContain('FOH Engineer');
  });

  it('groups crew by title/role', async () => {
    const mockCrew = [
      {
        contactId: '1',
        firstName: 'Alice',
        lastName: 'A',
        title: 'Musician',
        email: 'alice@test.com',
      },
      {
        contactId: '2',
        firstName: 'Bob',
        lastName: 'B',
        title: 'Musician',
        email: 'bob@test.com',
      },
      {
        contactId: '3',
        firstName: 'Charlie',
        lastName: 'C',
        title: 'Tour Manager',
        email: 'charlie@test.com',
      },
    ];

    (mockClient.getTourCrew as ReturnType<typeof vi.fn>).mockResolvedValue(mockCrew);

    const result = await getTourCrew(mockClient, { tourId: 'tour-123' });

    expect(result).toContain('Musician');
    expect(result).toContain('Tour Manager');
  });

  it('returns message when no crew exists', async () => {
    (mockClient.getTourCrew as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await getTourCrew(mockClient, { tourId: 'tour-123' });

    expect(result).toContain('No crew members');
  });

  it('uses default tour ID from environment', async () => {
    const originalEnv = process.env.MASTERTOUR_DEFAULT_TOUR_ID;
    process.env.MASTERTOUR_DEFAULT_TOUR_ID = 'default-tour';

    (mockClient.getTourCrew as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getTourCrew(mockClient, {});

    expect(mockClient.getTourCrew).toHaveBeenCalledWith('default-tour');

    process.env.MASTERTOUR_DEFAULT_TOUR_ID = originalEnv;
  });

  it('throws error when no tour ID provided and no default set', async () => {
    const originalEnv = process.env.MASTERTOUR_DEFAULT_TOUR_ID;
    delete process.env.MASTERTOUR_DEFAULT_TOUR_ID;

    await expect(getTourCrew(mockClient, {})).rejects.toThrow(
      'Tour ID is required'
    );

    process.env.MASTERTOUR_DEFAULT_TOUR_ID = originalEnv;
  });
});
