import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getVenueDetails } from '../../src/tools/getVenueDetails.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getVenueDetails', () => {
  let mockClient: MasterTourClient;

  const mockTours = [
    { tourId: 'tour1', organizationName: 'Org', artistName: 'Test Artist', legName: 'Spring 2026', organizationPermissionLevel: '1' },
  ];

  const mockTourData = {
    tour: {
      id: 'tour1',
      artistName: 'Test Artist',
      tourName: 'Tour1',
      legName: 'Spring 2026',
      days: [
        { id: 'day1', name: 'Hollywood Palladium', dayDate: '2026-01-04 00:00:00', dayType: 'Show Day', city: 'Los Angeles', state: 'CA', country: 'US' },
      ],
    },
  };

  const mockVenueEvent = {
    venueId: 'venue1',
    venueName: 'Hollywood Palladium',
    venueAddressLine1: '6215 Sunset Blvd',
    venueCity: 'Los Angeles',
    venueState: 'CA',
    venueZip: '90028',
    venueCountry: 'US',
    venueLatitude: '34.098554',
    venueLongitude: '-118.3242547',
    venueTimeZone: 'America/Los_Angeles',
    venuePrimaryUrl: 'http://www.hollywoodpalladium.com/',
    venueCapacity: '3500',
    venueType: 'Arena',
    venueContacts: [
      { title: 'Main Number', contactName: 'Alan Shuman', phone: '323-962-7600', fax: '323-962-7502' },
      { title: 'Box Office', phone: '323-962-1965' },
    ],
    venueProduction: {
      dimensionsW: "65'",
      dimensionsD: "25'",
      dimensionsH: "3'6\"",
      deckToGrid: "21'6\"",
      access: 'Lighted Ramp with a 30 degree incline',
    },
    venueFacilities: {
      showers: 'Yes',
      truckParking: 'Ample room for multiple semis',
    },
    venueEquipment: {},
    venueLocalCrew: {
      localUnion: 'IATSE Local 33',
    },
    venueLogistics: {
      directions: 'From I-5 South, take CA-170...',
    },
    promoterName: 'Live Nation',
    promoterCity: 'Los Angeles',
    promoterState: 'CA',
  };

  beforeEach(() => {
    mockClient = {
      listTours: vi.fn().mockResolvedValue(mockTours),
      getTourAll: vi.fn().mockResolvedValue(mockTourData),
      getDayEvents: vi.fn().mockResolvedValue([mockVenueEvent]),
    } as unknown as MasterTourClient;
  });

  it('should return detailed venue information', async () => {
    const result = await getVenueDetails(mockClient, { venueId: 'venue1' });
    
    expect(result.text).toContain('Hollywood Palladium');
    expect(result.text).toContain('6215 Sunset Blvd');
    expect(result.text).toContain('Los Angeles, CA 90028');
    expect(result.text).toContain('Capacity: 3500');
    expect(result.text).toContain('Type: Arena');
  });

  it('should include venue contacts', async () => {
    const result = await getVenueDetails(mockClient, { venueId: 'venue1' });
    
    expect(result.text).toContain('CONTACTS');
    expect(result.text).toContain('Alan Shuman');
    expect(result.text).toContain('323-962-7600');
    expect(result.text).toContain('Box Office');
  });

  it('should include production information', async () => {
    const result = await getVenueDetails(mockClient, { venueId: 'venue1' });
    
    expect(result.text).toContain('PRODUCTION');
    expect(result.text).toContain('Stage Dimensions');
    expect(result.text).toContain('Deck to Grid');
    expect(result.text).toContain('Load-In Access');
  });

  it('should include facilities information', async () => {
    const result = await getVenueDetails(mockClient, { venueId: 'venue1' });
    
    expect(result.text).toContain('FACILITIES');
    expect(result.text).toContain('Showers: Yes');
    expect(result.text).toContain('Truck Parking');
  });

  it('should include local crew information', async () => {
    const result = await getVenueDetails(mockClient, { venueId: 'venue1' });
    
    expect(result.text).toContain('LOCAL CREW');
    expect(result.text).toContain('IATSE Local 33');
  });

  it('should include logistics information', async () => {
    const result = await getVenueDetails(mockClient, { venueId: 'venue1' });
    
    expect(result.text).toContain('LOGISTICS');
    expect(result.text).toContain('Directions');
  });

  it('should include promoter information', async () => {
    const result = await getVenueDetails(mockClient, { venueId: 'venue1' });
    
    expect(result.text).toContain('PROMOTER');
    expect(result.text).toContain('Live Nation');
  });

  it('should show not found message for invalid venue ID', async () => {
    mockClient.getDayEvents = vi.fn().mockResolvedValue([]);
    
    const result = await getVenueDetails(mockClient, { venueId: 'nonexistent' });
    
    expect(result.text).toContain('Venue Not Found');
    expect(result.text).toContain('Could not find venue');
  });

  it('should throw error when venue ID is missing', async () => {
    await expect(getVenueDetails(mockClient, { venueId: '' }))
      .rejects.toThrow('Venue ID is required');
  });

  it('should show data source information', async () => {
    const result = await getVenueDetails(mockClient, { venueId: 'venue1' });
    
    expect(result.text).toContain('Data from: Test Artist - Spring 2026');
    expect(result.text).toContain('2026-01-04');
  });
});
