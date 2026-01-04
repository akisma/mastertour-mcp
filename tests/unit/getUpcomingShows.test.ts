import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getUpcomingShows } from '../../src/tools/getUpcomingShows.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getUpcomingShows', () => {
  let mockClient: MasterTourClient;

  // Mock "today" as 2026-01-03 (using UTC to avoid timezone issues)
  const mockToday = new Date('2026-01-03T12:00:00Z');
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockToday);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockTours = [
    { tourId: 'tour1', organizationName: 'Org', artistName: 'Artist1', legName: 'Leg1', organizationPermissionLevel: '1' },
    { tourId: 'tour2', organizationName: 'Org', artistName: 'Artist2', legName: 'Leg2', organizationPermissionLevel: '1' },
  ];

  // Using dates in the future from 2026-01-03
  const mockTour1Data = {
    tour: {
      id: 'tour1',
      artistName: 'Artist1',
      tourName: 'Tour1',
      legName: 'Leg1',
      days: [
        // Past show (should be excluded)
        { id: 'day0', name: 'Past Venue', dayDate: '2026-01-01 00:00:00', dayType: 'Show Day', city: 'Old City', state: 'OC', country: 'US' },
        // Tomorrow's show (should be included) 
        { id: 'day1', name: 'Hollywood Palladium', dayDate: '2026-01-04 00:00:00', dayType: 'Show Day', city: 'Los Angeles', state: 'CA', country: 'US' },
        // Day after's show (should be included)
        { id: 'day2', name: 'The Fonda Theatre', dayDate: '2026-01-05 00:00:00', dayType: 'Show Day', city: 'Los Angeles', state: 'CA', country: 'US' },
        // Day off (should be excluded)
        { id: 'day3', name: '', dayDate: '2026-01-06 00:00:00', dayType: 'Day Off', city: '', state: '', country: '' },
        // Future show
        { id: 'day4', name: 'Soda Bar', dayDate: '2026-01-10 00:00:00', dayType: 'Show Day', city: 'San Diego', state: 'CA', country: 'US' },
      ],
    },
  };

  const mockTour2Data = {
    tour: {
      id: 'tour2',
      artistName: 'Artist2',
      tourName: 'Tour2',
      legName: 'Leg2',
      days: [
        { id: 'day5', name: 'The Stone Pony', dayDate: '2026-02-01 00:00:00', dayType: 'Show Day', city: 'Asbury Park', state: 'NJ', country: 'US' },
      ],
    },
  };

  beforeEach(() => {
    mockClient = {
      listTours: vi.fn().mockResolvedValue(mockTours),
      getTourAll: vi.fn().mockImplementation((tourId) => {
        if (tourId === 'tour1') return Promise.resolve(mockTour1Data);
        if (tourId === 'tour2') return Promise.resolve(mockTour2Data);
        return Promise.reject(new Error('Tour not found'));
      }),
    } as unknown as MasterTourClient;
  });

  it('should return upcoming shows sorted by date', async () => {
    const result = await getUpcomingShows(mockClient, {});
    
    expect(result.text).toContain('Upcoming Shows');
    expect(result.text).toContain('Hollywood Palladium');
    expect(result.text).toContain('The Fonda Theatre');
    expect(result.text).toContain('Soda Bar');
    expect(result.text).toContain('Stone Pony');
    
    // Should not include past shows
    expect(result.text).not.toContain('Past Venue');
    // Should not include day off
    expect(result.text).not.toContain('Day Off');
  });

  it('should exclude past shows', async () => {
    const result = await getUpcomingShows(mockClient, {});
    
    expect(result.text).not.toContain('Old City');
    expect(result.text).not.toContain('day0');
  });

  it('should limit results', async () => {
    const result = await getUpcomingShows(mockClient, { limit: 2 });
    
    // Should show first two shows by date
    expect(result.text).toContain('Hollywood Palladium');
    expect(result.text).toContain('Fonda');
    expect(result.text).toContain('Showing next 2 of 4 shows');
  });

  it('should filter by days ahead', async () => {
    const result = await getUpcomingShows(mockClient, { daysAhead: 5 });
    
    // Should only include shows within 5 days (Jan 3 + 5 = Jan 8)
    expect(result.text).toContain('Hollywood Palladium');
    expect(result.text).toContain('Fonda');
    expect(result.text).not.toContain('Soda Bar'); // Jan 10, outside range
    expect(result.text).not.toContain('Stone Pony'); // Feb 1
  });

  it('should filter by specific tour', async () => {
    const result = await getUpcomingShows(mockClient, { tourId: 'tour1' });
    
    expect(mockClient.listTours).not.toHaveBeenCalled();
    expect(result.text).toContain('Hollywood Palladium');
    expect(result.text).not.toContain('Stone Pony');
  });

  it('should show tour name when searching all tours', async () => {
    const result = await getUpcomingShows(mockClient, {});
    
    expect(result.text).toContain('Artist1 - Leg1');
    expect(result.text).toContain('Artist2 - Leg2');
  });

  it('should show no shows message when none found', async () => {
    mockClient.getTourAll = vi.fn().mockResolvedValue({
      tour: { id: 'empty', artistName: 'Empty', tourName: '', legName: 'Empty', days: [] },
    });
    
    const result = await getUpcomingShows(mockClient, {});
    
    expect(result.text).toContain('No upcoming shows found');
  });

  it('should include day IDs for follow-up queries', async () => {
    const result = await getUpcomingShows(mockClient, { limit: 3 });
    
    expect(result.text).toContain('Day ID: day1');
    expect(result.text).toContain('Day ID: day2');
  });

  it('should format dates in readable format', async () => {
    const result = await getUpcomingShows(mockClient, { limit: 1 });
    
    // Should have formatted date with weekday, month, day, year
    expect(result.text).toMatch(/Jan.*2026/);
    expect(result.text).toMatch(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)/);
  });
});
