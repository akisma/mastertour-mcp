import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHotelContacts } from '../../src/tools/getHotelContacts.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getHotelContacts', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      getHotelContacts: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('returns formatted contacts for a hotel', async () => {
    const mockData = {
      hotelId: 'hotel-123',
      hotelName: 'Hilton Times Square',
      contacts: [
        {
          name: 'Sarah Manager',
          title: 'General Manager',
          email: 'sarah@hilton.com',
          phone: '555-1234',
        },
        {
          name: 'Tom Desk',
          title: 'Front Desk',
          phone: '555-5678',
        },
      ],
    };

    (mockClient.getHotelContacts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getHotelContacts(mockClient, { hotelId: 'hotel-123' });

    expect(mockClient.getHotelContacts).toHaveBeenCalledWith('hotel-123');
    expect(result.data.totalContacts).toBe(2);
    expect(result.text).toContain('Hilton Times Square');
    expect(result.text).toContain('Sarah Manager');
    expect(result.text).toContain('sarah@hilton.com');
    expect(result.text).toContain('555-1234');
    expect(result.text).toContain('Tom Desk');
  });

  it('handles empty contacts list', async () => {
    const mockData = {
      hotelId: 'hotel-123',
      hotelName: 'Empty Hotel',
      contacts: [],
    };

    (mockClient.getHotelContacts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getHotelContacts(mockClient, { hotelId: 'hotel-123' });

    expect(result.data.totalContacts).toBe(0);
    expect(result.text).toContain('No contacts on file');
  });

  it('throws error when no hotel ID provided', async () => {
    await expect(getHotelContacts(mockClient, { hotelId: '' })).rejects.toThrow(
      'Hotel ID is required'
    );
  });

  it('groups contacts by department/title', async () => {
    const mockData = {
      hotelId: 'hotel-123',
      contacts: [
        { name: 'Manager A', department: 'Management', phone: '111' },
        { name: 'Manager B', department: 'Management', phone: '222' },
        { name: 'Concierge', title: 'Concierge', phone: '333' },
      ],
    };

    (mockClient.getHotelContacts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getHotelContacts(mockClient, { hotelId: 'hotel-123' });

    expect(result.text).toContain('Management');
    expect(result.text).toContain('Concierge');
    expect(result.data.totalContacts).toBe(3);
  });

  it('displays fax when present', async () => {
    const mockData = {
      hotelId: 'hotel-123',
      contacts: [
        { name: 'Front Desk', fax: '555-FAX-0000' },
      ],
    };

    (mockClient.getHotelContacts as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getHotelContacts(mockClient, { hotelId: 'hotel-123' });

    expect(result.text).toContain('555-FAX-0000');
  });
});
