import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEventGuestlist } from '../../src/tools/getEventGuestlist.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getEventGuestlist', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      getEventGuestlist: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('returns formatted guest list for an event', async () => {
    const mockData = {
      eventId: 'event-123',
      eventName: 'Madison Square Garden',
      date: '2024-06-15',
      guests: [
        {
          id: 'guest-1',
          name: 'John Smith',
          tickets: 2,
          status: 'Approved',
          requestedBy: 'Tour Manager',
          notes: 'VIP area',
          willCall: true,
        },
        {
          id: 'guest-2',
          name: 'Jane Doe',
          tickets: 4,
          status: 'Pending',
          willCall: false,
        },
      ],
    };

    (mockClient.getEventGuestlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getEventGuestlist(mockClient, { eventId: 'event-123' });

    expect(mockClient.getEventGuestlist).toHaveBeenCalledWith('event-123');
    expect(result.data.totalGuests).toBe(2);
    expect(result.data.totalTickets).toBe(6);
    expect(result.text).toContain('John Smith');
    expect(result.text).toContain('2 tickets');
    expect(result.text).toContain('Will Call');
    expect(result.text).toContain('Approved');
    expect(result.text).toContain('Pending');
  });

  it('handles empty guest list', async () => {
    const mockData = {
      eventId: 'event-123',
      eventName: 'Empty Event',
      guests: [],
    };

    (mockClient.getEventGuestlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getEventGuestlist(mockClient, { eventId: 'event-123' });

    expect(result.data.totalGuests).toBe(0);
    expect(result.data.totalTickets).toBe(0);
    expect(result.text).toContain('No guests on the list');
  });

  it('throws error when no event ID provided', async () => {
    await expect(getEventGuestlist(mockClient, { eventId: '' })).rejects.toThrow(
      'Event ID is required'
    );
  });

  it('groups guests by status in text output', async () => {
    const mockData = {
      eventId: 'event-123',
      guests: [
        { id: '1', name: 'Guest A', tickets: 2, status: 'Approved' },
        { id: '2', name: 'Guest B', tickets: 2, status: 'Approved' },
        { id: '3', name: 'Guest C', tickets: 1, status: 'Denied' },
      ],
    };

    (mockClient.getEventGuestlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getEventGuestlist(mockClient, { eventId: 'event-123' });

    expect(result.text).toContain('Approved');
    expect(result.text).toContain('Denied');
    expect(result.data.totalTickets).toBe(5);
  });
});
