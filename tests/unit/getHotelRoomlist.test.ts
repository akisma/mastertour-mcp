import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHotelRoomlist } from '../../src/tools/getHotelRoomlist.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getHotelRoomlist', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      getHotelRoomlist: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('returns formatted room list for a hotel', async () => {
    const mockData = {
      hotelId: 'hotel-123',
      hotelName: 'Hilton Times Square',
      rooms: [
        {
          roomNumber: '1201',
          roomType: 'Suite',
          guestName: 'John Smith',
          checkIn: '2024-06-14',
          checkOut: '2024-06-16',
          confirmationNumber: 'CONF123',
        },
        {
          roomNumber: '1202',
          roomType: 'Standard',
          guestName: 'Jane Doe',
          checkIn: '2024-06-14',
          checkOut: '2024-06-16',
        },
      ],
    };

    (mockClient.getHotelRoomlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getHotelRoomlist(mockClient, { hotelId: 'hotel-123' });

    expect(mockClient.getHotelRoomlist).toHaveBeenCalledWith('hotel-123');
    expect(result.data.totalRooms).toBe(2);
    expect(result.text).toContain('Hilton Times Square');
    expect(result.text).toContain('John Smith');
    expect(result.text).toContain('Room 1201');
    expect(result.text).toContain('Suite');
    expect(result.text).toContain('CONF123');
  });

  it('handles empty room list', async () => {
    const mockData = {
      hotelId: 'hotel-123',
      hotelName: 'Empty Hotel',
      rooms: [],
    };

    (mockClient.getHotelRoomlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getHotelRoomlist(mockClient, { hotelId: 'hotel-123' });

    expect(result.data.totalRooms).toBe(0);
    expect(result.text).toContain('No room assignments');
  });

  it('throws error when no hotel ID provided', async () => {
    await expect(getHotelRoomlist(mockClient, { hotelId: '' })).rejects.toThrow(
      'Hotel ID is required'
    );
  });

  it('groups rooms by type in text output', async () => {
    const mockData = {
      hotelId: 'hotel-123',
      rooms: [
        { guestName: 'Guest A', roomType: 'Suite', roomNumber: '100' },
        { guestName: 'Guest B', roomType: 'Suite', roomNumber: '101' },
        { guestName: 'Guest C', roomType: 'Standard', roomNumber: '200' },
      ],
    };

    (mockClient.getHotelRoomlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getHotelRoomlist(mockClient, { hotelId: 'hotel-123' });

    expect(result.text).toContain('Suite');
    expect(result.text).toContain('Standard');
    expect(result.data.totalRooms).toBe(3);
  });

  it('displays room notes when present', async () => {
    const mockData = {
      hotelId: 'hotel-123',
      rooms: [
        { guestName: 'VIP Guest', roomNumber: '1000', notes: 'Late checkout requested' },
      ],
    };

    (mockClient.getHotelRoomlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getHotelRoomlist(mockClient, { hotelId: 'hotel-123' });

    expect(result.text).toContain('Late checkout requested');
  });
});
