import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addGuestRequest } from '../../src/tools/addGuestRequest.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('addGuestRequest', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      createGuestRequest: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('creates a new guest request', async () => {
    (mockClient.createGuestRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'guest-new-123',
    });

    const result = await addGuestRequest(mockClient, {
      eventId: 'event-123',
      name: 'John Smith',
      tickets: 2,
      notes: 'VIP guest',
      willCall: true,
    });

    expect(mockClient.createGuestRequest).toHaveBeenCalledWith({
      eventId: 'event-123',
      name: 'John Smith',
      tickets: 2,
      notes: 'VIP guest',
      willCall: true,
    });
    expect(result.data.success).toBe(true);
    expect(result.data.guestListId).toBe('guest-new-123');
    expect(result.data.action).toBe('created');
    expect(result.text).toContain('Guest Added');
    expect(result.text).toContain('John Smith');
    expect(result.text).toContain('2');
  });

  it('throws error when event ID is missing', async () => {
    await expect(
      addGuestRequest(mockClient, { eventId: '', name: 'John', tickets: 2 })
    ).rejects.toThrow('Event ID is required');
  });

  it('throws error when name is empty', async () => {
    await expect(
      addGuestRequest(mockClient, { eventId: 'event-123', name: '', tickets: 2 })
    ).rejects.toThrow('Guest name is required');
  });

  it('throws error when name is only whitespace', async () => {
    await expect(
      addGuestRequest(mockClient, { eventId: 'event-123', name: '   ', tickets: 2 })
    ).rejects.toThrow('Guest name is required');
  });

  it('throws error when tickets is less than 1', async () => {
    await expect(
      addGuestRequest(mockClient, { eventId: 'event-123', name: 'John', tickets: 0 })
    ).rejects.toThrow('Ticket count must be at least 1');
  });

  it('trims whitespace from name', async () => {
    (mockClient.createGuestRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'guest-123',
    });

    await addGuestRequest(mockClient, {
      eventId: 'event-123',
      name: '  John Smith  ',
      tickets: 1,
    });

    expect(mockClient.createGuestRequest).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'John Smith' })
    );
  });

  it('includes will call info in text output when set', async () => {
    (mockClient.createGuestRequest as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'guest-123',
    });

    const result = await addGuestRequest(mockClient, {
      eventId: 'event-123',
      name: 'John',
      tickets: 2,
      willCall: true,
    });

    expect(result.text).toContain('Will Call: Yes');
  });
});
