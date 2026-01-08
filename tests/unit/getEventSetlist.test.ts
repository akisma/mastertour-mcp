import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getEventSetlist } from '../../src/tools/getEventSetlist.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getEventSetlist', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      getEventSetlist: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('returns formatted setlist for an event', async () => {
    const mockData = {
      eventId: 'event-123',
      eventName: 'Madison Square Garden',
      date: '2024-06-15',
      songs: [
        { position: 1, songTitle: 'Opening Song', duration: '4:30', isEncore: false },
        { position: 2, songTitle: 'Hit Single', duration: '3:45', isEncore: false },
        { position: 3, songTitle: 'Fan Favorite', duration: '5:00', notes: 'Extended version', isEncore: false },
        { position: 4, songTitle: 'Encore Song', duration: '6:00', isEncore: true },
      ],
    };

    (mockClient.getEventSetlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getEventSetlist(mockClient, { eventId: 'event-123' });

    expect(mockClient.getEventSetlist).toHaveBeenCalledWith('event-123');
    expect(result.data.totalSongs).toBe(4);
    expect(result.text).toContain('Opening Song');
    expect(result.text).toContain('Hit Single');
    expect(result.text).toContain('Main Set');
    expect(result.text).toContain('Encore');
    expect(result.text).toContain('Extended version');
  });

  it('handles empty setlist', async () => {
    const mockData = {
      eventId: 'event-123',
      songs: [],
    };

    (mockClient.getEventSetlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getEventSetlist(mockClient, { eventId: 'event-123' });

    expect(result.data.totalSongs).toBe(0);
    expect(result.text).toContain('No setlist available');
  });

  it('throws error when no event ID provided', async () => {
    await expect(getEventSetlist(mockClient, { eventId: '' })).rejects.toThrow(
      'Event ID is required'
    );
  });

  it('calculates estimated duration from song durations', async () => {
    const mockData = {
      eventId: 'event-123',
      songs: [
        { position: 1, songTitle: 'Song 1', duration: '30:00', isEncore: false },
        { position: 2, songTitle: 'Song 2', duration: '30:00', isEncore: false },
        { position: 3, songTitle: 'Song 3', duration: '30:00', isEncore: false },
      ],
    };

    (mockClient.getEventSetlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getEventSetlist(mockClient, { eventId: 'event-123' });

    expect(result.data.estimatedDuration).toBe('1h 30m');
    expect(result.text).toContain('1h 30m');
  });

  it('displays song notes when present', async () => {
    const mockData = {
      eventId: 'event-123',
      songs: [
        { position: 1, songTitle: 'Special Song', notes: 'Acoustic version tonight', isEncore: false },
      ],
    };

    (mockClient.getEventSetlist as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getEventSetlist(mockClient, { eventId: 'event-123' });

    expect(result.text).toContain('Acoustic version tonight');
  });
});
