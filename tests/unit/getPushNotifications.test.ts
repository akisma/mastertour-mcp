import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPushNotifications } from '../../src/tools/getPushNotifications.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('getPushNotifications', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      getPushNotifications: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('returns formatted notifications', async () => {
    const mockData = {
      notifications: [
        {
          id: 'notif-1',
          timestamp: '2024-06-15T14:30:00Z',
          title: 'Schedule Updated',
          message: 'Soundcheck moved to 3pm',
          type: 'schedule',
          read: false,
        },
        {
          id: 'notif-2',
          timestamp: '2024-06-15T10:00:00Z',
          title: 'Guest List',
          message: 'New guest added',
          type: 'guestlist',
          read: true,
        },
      ],
      totalCount: 2,
      unreadCount: 1,
    };

    (mockClient.getPushNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getPushNotifications(mockClient, {});

    expect(result.data.totalCount).toBe(2);
    expect(result.data.unreadCount).toBe(1);
    expect(result.text).toContain('Schedule Updated');
    expect(result.text).toContain('Soundcheck moved to 3pm');
    expect(result.text).toContain('Guest List');
  });

  it('handles empty notifications', async () => {
    const mockData = {
      notifications: [],
      totalCount: 0,
    };

    (mockClient.getPushNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getPushNotifications(mockClient, {});

    expect(result.data.totalCount).toBe(0);
    expect(result.text).toContain('No notifications found');
  });

  it('passes limit parameter to client', async () => {
    (mockClient.getPushNotifications as ReturnType<typeof vi.fn>).mockResolvedValue({
      notifications: [],
      totalCount: 0,
    });

    await getPushNotifications(mockClient, { limit: 5 });

    expect(mockClient.getPushNotifications).toHaveBeenCalledWith({ limit: 5, since: undefined });
  });

  it('passes since parameter to client', async () => {
    (mockClient.getPushNotifications as ReturnType<typeof vi.fn>).mockResolvedValue({
      notifications: [],
      totalCount: 0,
    });

    await getPushNotifications(mockClient, { since: '2024-06-01T00:00:00Z' });

    expect(mockClient.getPushNotifications).toHaveBeenCalledWith({
      limit: undefined,
      since: '2024-06-01T00:00:00Z',
    });
  });

  it('groups notifications by date in text output', async () => {
    const mockData = {
      notifications: [
        { id: '1', timestamp: '2024-06-15T14:30:00Z', title: 'Today Notif', message: 'msg' },
        { id: '2', timestamp: '2024-06-15T10:00:00Z', title: 'Today Also', message: 'msg' },
        { id: '3', timestamp: '2024-06-14T12:00:00Z', title: 'Yesterday', message: 'msg' },
      ],
      totalCount: 3,
    };

    (mockClient.getPushNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getPushNotifications(mockClient, {});

    expect(result.text).toContain('Today Notif');
    expect(result.text).toContain('Yesterday');
  });

  it('shows unread indicator for unread notifications', async () => {
    const mockData = {
      notifications: [
        { id: '1', timestamp: '2024-06-15T14:30:00Z', title: 'Unread', message: 'msg', read: false },
      ],
      totalCount: 1,
      unreadCount: 1,
    };

    (mockClient.getPushNotifications as ReturnType<typeof vi.fn>).mockResolvedValue(mockData);

    const result = await getPushNotifications(mockClient, {});

    // The blue dot indicator for unread
    expect(result.text).toContain('Unread: 1');
  });

  it('works with no parameters', async () => {
    (mockClient.getPushNotifications as ReturnType<typeof vi.fn>).mockResolvedValue({
      notifications: [],
      totalCount: 0,
    });

    const result = await getPushNotifications(mockClient);

    expect(mockClient.getPushNotifications).toHaveBeenCalledWith({
      limit: undefined,
      since: undefined,
    });
    expect(result.data.totalCount).toBe(0);
  });
});
