/**
 * Testing utilities for creating mock MasterTourClient instances.
 * Import from 'src/testing/mockClient.js' in test files.
 */
import { vi } from 'vitest';
import type { MasterTourClient, DayResponse, DaySummaryResponse, ScheduleItem } from '../api/client.js';

/**
 * Mock function type for better TypeScript inference
 */
type MockFn = ReturnType<typeof vi.fn>;

/**
 * MasterTourClient with all methods as mock functions
 */
export type MockClient = MasterTourClient & {
  listTours: MockFn;
  getDay: MockFn;
  getTourSummary: MockFn;
  getTourHotels: MockFn;
  getTourCrew: MockFn;
  getTourEvents: MockFn;
  createScheduleItem: MockFn;
  updateScheduleItem: MockFn;
  deleteScheduleItem: MockFn;
  updateDayNotes: MockFn;
};

/**
 * Creates a mock MasterTourClient with all methods as vi.fn() mocks.
 * Allows partial overrides for specific test scenarios.
 *
 * @example
 * ```ts
 * const client = createMockClient();
 * client.getDay.mockResolvedValue(mockDayResponse());
 * ```
 */
export function createMockClient(overrides?: Partial<Record<keyof MasterTourClient, MockFn>>): MockClient {
  return {
    listTours: vi.fn(),
    getDay: vi.fn(),
    getTourSummary: vi.fn(),
    getTourHotels: vi.fn(),
    getTourCrew: vi.fn(),
    getTourEvents: vi.fn(),
    createScheduleItem: vi.fn(),
    updateScheduleItem: vi.fn(),
    deleteScheduleItem: vi.fn(),
    updateDayNotes: vi.fn(),
    ...overrides,
  } as MockClient;
}

/**
 * Options for creating a mock day response
 */
export interface MockDayOptions {
  dayId?: string;
  dayDate?: string;
  timezone?: string;
  scheduleItems?: Partial<ScheduleItem>[];
}

/**
 * Creates a mock DayResponse with sensible defaults.
 *
 * @example
 * ```ts
 * const response = mockDayResponse({ timezone: 'America/New_York' });
 * client.getDay.mockResolvedValue(response);
 * ```
 */
export function mockDayResponse(options: MockDayOptions = {}): DayResponse {
  const {
    dayId = 'day-123',
    dayDate = '2026-01-04',
    timezone = 'America/Los_Angeles',
    scheduleItems = [],
  } = options;

  return {
    day: {
      id: dayId,
      tourId: 'tour-123',
      name: 'Test Day',
      dayDate: `${dayDate} 00:00:00`,
      timeZone: timezone,
      dayType: 'show',
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA',
      scheduleItems: scheduleItems as ScheduleItem[],
    },
  };
}

/**
 * Options for creating a mock tour summary
 */
export interface MockTourSummaryOptions {
  dayId?: string;
  days?: Array<{ id: string }>;
}

/**
 * Creates a mock tour summary response.
 *
 * @example
 * ```ts
 * const summary = mockTourSummary({ dayId: 'day-456' });
 * client.getTourSummary.mockResolvedValue(summary);
 * ```
 */
export function mockTourSummary(options: MockTourSummaryOptions = {}): DaySummaryResponse[] {
  if (options.days) {
    return options.days as DaySummaryResponse[];
  }
  return [{ id: options.dayId ?? 'day-123' }] as DaySummaryResponse[];
}
