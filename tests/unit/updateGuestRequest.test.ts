import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateGuestRequest } from '../../src/tools/updateGuestRequest.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('updateGuestRequest', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      updateGuestRequest: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('updates guest request with new values', async () => {
    (mockClient.updateGuestRequest as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await updateGuestRequest(mockClient, {
      guestListId: 'guest-123',
      name: 'John Smith Updated',
      tickets: 4,
      status: 'Approved',
    });

    expect(mockClient.updateGuestRequest).toHaveBeenCalledWith('guest-123', {
      name: 'John Smith Updated',
      tickets: 4,
      status: 'Approved',
    });
    expect(result.data.success).toBe(true);
    expect(result.data.action).toBe('updated');
    expect(result.text).toContain('Guest Request Updated');
    expect(result.text).toContain('Name: John Smith Updated');
    expect(result.text).toContain('Tickets: 4');
  });

  it('throws error when guest list ID is missing', async () => {
    await expect(
      updateGuestRequest(mockClient, { guestListId: '', name: 'John' })
    ).rejects.toThrow('Guest list ID is required');
  });

  it('throws error when no fields to update', async () => {
    await expect(
      updateGuestRequest(mockClient, { guestListId: 'guest-123' })
    ).rejects.toThrow('At least one field to update is required');
  });

  it('throws error when tickets is less than 1', async () => {
    await expect(
      updateGuestRequest(mockClient, { guestListId: 'guest-123', tickets: 0 })
    ).rejects.toThrow('Ticket count must be at least 1');
  });

  it('allows updating only status', async () => {
    (mockClient.updateGuestRequest as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await updateGuestRequest(mockClient, {
      guestListId: 'guest-123',
      status: 'Denied',
    });

    expect(mockClient.updateGuestRequest).toHaveBeenCalledWith('guest-123', {
      status: 'Denied',
    });
    expect(result.text).toContain('Status: Denied');
  });

  it('allows updating willCall status', async () => {
    (mockClient.updateGuestRequest as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await updateGuestRequest(mockClient, {
      guestListId: 'guest-123',
      willCall: false,
    });

    expect(mockClient.updateGuestRequest).toHaveBeenCalledWith('guest-123', {
      willCall: false,
    });
    expect(result.text).toContain('Will Call: No');
  });

  it('shows all updated fields in output', async () => {
    (mockClient.updateGuestRequest as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    const result = await updateGuestRequest(mockClient, {
      guestListId: 'guest-123',
      name: 'New Name',
      tickets: 5,
      status: 'Approved',
      notes: 'Updated notes',
      willCall: true,
    });

    expect(result.text).toContain('Name: New Name');
    expect(result.text).toContain('Tickets: 5');
    expect(result.text).toContain('Status: Approved');
    expect(result.text).toContain('Notes: Updated notes');
    expect(result.text).toContain('Will Call: Yes');
  });
});
