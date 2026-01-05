import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listTours } from '../../src/tools/listTours.ts';
import type { MasterTourClient } from '../../src/api/client.ts';

describe('listTours', () => {
  let mockClient: MasterTourClient;

  beforeEach(() => {
    mockClient = {
      getDay: vi.fn(),
      getTourSummary: vi.fn(),
      createScheduleItem: vi.fn(),
      updateScheduleItem: vi.fn(),
      deleteScheduleItem: vi.fn(),
      updateDayNotes: vi.fn(),
      listTours: vi.fn(),
    } as unknown as MasterTourClient;
  });

  it('returns formatted list of tours', async () => {
    const mockTours = [
      {
        tourId: 'tour-123',
        organizationName: 'Test Artist',
        artistName: 'Test Artist',
        legName: 'Spring 2024 Tour',
        organizationPermissionLevel: '255',
      },
      {
        tourId: 'tour-456',
        organizationName: 'Another Artist',
        artistName: 'Another Artist',
        legName: 'Summer Festival Run',
        organizationPermissionLevel: '4',
      },
    ];

    (mockClient.listTours as ReturnType<typeof vi.fn>).mockResolvedValue(mockTours);

    const result = await listTours(mockClient);

    expect(mockClient.listTours).toHaveBeenCalledOnce();
    expect(result.text).toContain('🎸 Available Tours');
    expect(result.text).toContain('Test Artist');
    expect(result.text).toContain('Spring 2024 Tour');
    expect(result.text).toContain('tour-123');
    expect(result.text).toContain('Another Artist');
    expect(result.text).toContain('Summer Festival Run');
    expect(result.text).toContain('tour-456');
  });

  it('indicates admin access for permission level 255', async () => {
    const mockTours = [
      {
        tourId: 'tour-123',
        organizationName: 'Admin Tour',
        artistName: 'Admin Tour',
        legName: 'Full Access',
        organizationPermissionLevel: '255',
      },
    ];

    (mockClient.listTours as ReturnType<typeof vi.fn>).mockResolvedValue(mockTours);

    const result = await listTours(mockClient);

    expect(result.text).toContain('✏️ Edit Access');
  });

  it('indicates read-only for low permission levels', async () => {
    const mockTours = [
      {
        tourId: 'tour-123',
        organizationName: 'Read Only Tour',
        artistName: 'Read Only Tour',
        legName: 'View Only',
        organizationPermissionLevel: '4',
      },
    ];

    (mockClient.listTours as ReturnType<typeof vi.fn>).mockResolvedValue(mockTours);

    const result = await listTours(mockClient);

    expect(result.text).toContain('👁️ Read Only');
  });

  it('returns friendly message when no tours available', async () => {
    (mockClient.listTours as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await listTours(mockClient);

    expect(result.text).toContain('No tours available');
  });

  it('groups tours by organization', async () => {
    const mockTours = [
      {
        tourId: 'tour-1',
        organizationName: 'Band A',
        artistName: 'Band A',
        legName: 'Leg 1',
        organizationPermissionLevel: '255',
      },
      {
        tourId: 'tour-2',
        organizationName: 'Band A',
        artistName: 'Band A',
        legName: 'Leg 2',
        organizationPermissionLevel: '255',
      },
      {
        tourId: 'tour-3',
        organizationName: 'Band B',
        artistName: 'Band B',
        legName: 'Solo Tour',
        organizationPermissionLevel: '52',
      },
    ];

    (mockClient.listTours as ReturnType<typeof vi.fn>).mockResolvedValue(mockTours);

    const result = await listTours(mockClient);

    // Check organization headers appear
    expect(result.text).toContain('Band A');
    expect(result.text).toContain('Band B');
    // Check both legs appear under Band A
    expect(result.text).toContain('Leg 1');
    expect(result.text).toContain('Leg 2');
  });
});
