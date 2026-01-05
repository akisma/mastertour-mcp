import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchPastVenues } from '../../src/tools/searchPastVenues.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('searchPastVenues', () => {
  let mockClient: MasterTourClient;

  const mockTours = [
    { tourId: 'tour1', organizationName: 'Org', artistName: 'Artist1', legName: 'Leg1', organizationPermissionLevel: '1' },
    { tourId: 'tour2', organizationName: 'Org', artistName: 'Artist2', legName: 'Leg2', organizationPermissionLevel: '1' },
  ];

  const mockTour1Data = {
    tour: {
      id: 'tour1',
      artistName: 'Artist1',
      tourName: 'Tour1',
      legName: 'Leg1',
      days: [
        { id: 'day1', name: 'Hollywood Palladium', dayDate: '2026-01-04 00:00:00', dayType: 'Show Day', city: 'Los Angeles', state: 'CA', country: 'US' },
        { id: 'day2', name: 'The Fonda Theatre', dayDate: '2026-01-05 00:00:00', dayType: 'Show Day', city: 'Los Angeles', state: 'CA', country: 'US' },
        { id: 'day3', name: '', dayDate: '2026-01-06 00:00:00', dayType: 'Day Off', city: '', state: '', country: '' },
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
        { id: 'day4', name: 'The Stone Pony', dayDate: '2026-02-01 00:00:00', dayType: 'Show Day', city: 'Asbury Park', state: 'NJ', country: 'US' },
      ],
    },
  };

  const mockDayEvents: Record<string, Array<Record<string, unknown>>> = {
    day1: [{
      venueId: 'venue1',
      venueName: 'Hollywood Palladium',
      venueCity: 'Los Angeles',
      venueState: 'CA',
      venueCountry: 'US',
      venueCapacity: '3500',
      venueType: 'Arena',
    }],
    day2: [{
      venueId: 'venue2',
      venueName: 'The Fonda Theatre',
      venueCity: 'Los Angeles',
      venueState: 'CA',
      venueCountry: 'US',
      venueCapacity: '1350',
      venueType: 'Theatre',
    }],
    day4: [{
      venueId: 'venue3',
      venueName: 'The Stone Pony',
      venueCity: 'Asbury Park',
      venueState: 'NJ',
      venueCountry: 'US',
      venueCapacity: '1000',
      venueType: 'Club',
    }],
  };

  beforeEach(() => {
    mockClient = {
      listTours: vi.fn().mockResolvedValue(mockTours),
      getTourAll: vi.fn().mockImplementation((tourId) => {
        if (tourId === 'tour1') return Promise.resolve(mockTour1Data);
        if (tourId === 'tour2') return Promise.resolve(mockTour2Data);
        return Promise.reject(new Error('Tour not found'));
      }),
      getDayEvents: vi.fn().mockImplementation((dayId) => {
        return Promise.resolve(mockDayEvents[dayId] || []);
      }),
    } as unknown as MasterTourClient;
  });

  it('should search venues by name', async () => {
    const result = await searchPastVenues(mockClient, { query: 'palladium' });
    
    expect(result.text).toContain('Hollywood Palladium');
    expect(result.text).toContain('Los Angeles');
    expect(result.text).toContain('venue1');
    expect(result.text).not.toContain('Stone Pony');
  });

  it('should search venues by city', async () => {
    const result = await searchPastVenues(mockClient, { query: 'los angeles' });
    
    expect(result.text).toContain('Hollywood Palladium');
    expect(result.text).toContain('The Fonda Theatre');
    expect(result.text).not.toContain('Stone Pony');
  });

  it('should search venues by state', async () => {
    const result = await searchPastVenues(mockClient, { query: 'NJ' });
    
    expect(result.text).toContain('Stone Pony');
    expect(result.text).toContain('Asbury Park');
    expect(result.text).not.toContain('Palladium');
  });

  it('should show no results message when no venues match', async () => {
    const result = await searchPastVenues(mockClient, { query: 'nonexistent venue' });
    
    expect(result.text).toContain('No venues found');
    expect(result.text).toContain('Tips:');
  });

  it('should limit results', async () => {
    const result = await searchPastVenues(mockClient, { query: 'los angeles', limit: 1 });
    
    // Should only contain one venue even though two match
    const venueMatches = result.text.match(/🏟️/g);
    expect(venueMatches?.length).toBe(1);
  });

  it('should search specific tour when tourId provided', async () => {
    mockClient.listTours = vi.fn(); // Should not be called
    
    const result = await searchPastVenues(mockClient, { query: 'palladium', tourId: 'tour1' });
    
    expect(mockClient.listTours).not.toHaveBeenCalled();
    expect(result.text).toContain('Hollywood Palladium');
  });

  it('should throw error for short query', async () => {
    await expect(searchPastVenues(mockClient, { query: 'a' }))
      .rejects.toThrow('at least 2 characters');
  });

  it('should show tour count for venues used on multiple tours', async () => {
    // Modify mock to have same venue on both tours
    const sharedVenueId = 'shared-venue';
    mockDayEvents['day1'] = [{
      venueId: sharedVenueId,
      venueName: 'Shared Venue',
      venueCity: 'Test City',
      venueState: 'TS',
      venueCountry: 'US',
      venueCapacity: '1000',
      venueType: 'Arena',
    }];
    mockDayEvents['day4'] = [{
      venueId: sharedVenueId,
      venueName: 'Shared Venue',
      venueCity: 'Test City',
      venueState: 'TS',
      venueCountry: 'US',
      venueCapacity: '1000',
      venueType: 'Arena',
    }];
    
    const result = await searchPastVenues(mockClient, { query: 'shared' });
    
    expect(result.text).toContain('Shared Venue');
    expect(result.text).toContain('Artist1 - Leg1');
    expect(result.text).toContain('Artist2 - Leg2');
  });
});
