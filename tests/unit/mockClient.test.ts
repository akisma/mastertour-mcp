import { describe, it, expect, vi } from 'vitest';
import { createMockClient, mockDayResponse, mockTourSummary } from '../../src/testing/mockClient.js';

describe('createMockClient', () => {
  it('creates a mock client with all methods as vi.fn()', () => {
    const client = createMockClient();

    // Verify all required methods exist and are mock functions
    expect(vi.isMockFunction(client.listTours)).toBe(true);
    expect(vi.isMockFunction(client.getDay)).toBe(true);
    expect(vi.isMockFunction(client.getTourSummary)).toBe(true);
    expect(vi.isMockFunction(client.getTourHotels)).toBe(true);
    expect(vi.isMockFunction(client.getTourCrew)).toBe(true);
    expect(vi.isMockFunction(client.getTourEvents)).toBe(true);
    expect(vi.isMockFunction(client.createScheduleItem)).toBe(true);
    expect(vi.isMockFunction(client.updateScheduleItem)).toBe(true);
    expect(vi.isMockFunction(client.deleteScheduleItem)).toBe(true);
    expect(vi.isMockFunction(client.updateDayNotes)).toBe(true);
  });

  it('allows overriding specific methods', () => {
    const customGetDay = vi.fn().mockResolvedValue({ custom: 'value' });
    const client = createMockClient({ getDay: customGetDay });

    expect(client.getDay).toBe(customGetDay);
    // Other methods should still be default mocks
    expect(vi.isMockFunction(client.listTours)).toBe(true);
  });

  it('creates independent mock instances', () => {
    const client1 = createMockClient();
    const client2 = createMockClient();

    client1.listTours.mockResolvedValue([{ id: '1' }]);
    client2.listTours.mockResolvedValue([{ id: '2' }]);

    // They should be different mock instances
    expect(client1.listTours).not.toBe(client2.listTours);
  });
});

describe('mockDayResponse', () => {
  it('creates a day response with default timezone', () => {
    const response = mockDayResponse();

    expect(response.day.timeZone).toBe('America/Los_Angeles');
    expect(response.day.dayDate).toBeDefined();
    expect(response.day.scheduleItems).toEqual([]);
  });

  it('allows overriding timezone', () => {
    const response = mockDayResponse({ timezone: 'America/New_York' });

    expect(response.day.timeZone).toBe('America/New_York');
  });

  it('allows overriding dayDate', () => {
    const response = mockDayResponse({ dayDate: '2026-07-15' });

    expect(response.day.dayDate).toBe('2026-07-15 00:00:00');
  });

  it('allows adding schedule items', () => {
    const items = [
      { id: 'item-1', title: 'Soundcheck' },
      { id: 'item-2', title: 'Show' },
    ];
    const response = mockDayResponse({ scheduleItems: items });

    expect(response.day.scheduleItems).toEqual(items);
  });
});

describe('mockTourSummary', () => {
  it('creates a tour summary with default day ID', () => {
    const summary = mockTourSummary();

    expect(summary).toEqual([{ id: 'day-123' }]);
  });

  it('allows overriding the day ID', () => {
    const summary = mockTourSummary({ dayId: 'custom-day-456' });

    expect(summary).toEqual([{ id: 'custom-day-456' }]);
  });

  it('allows specifying multiple days', () => {
    const summary = mockTourSummary({ days: [{ id: 'day-1' }, { id: 'day-2' }] });

    expect(summary).toHaveLength(2);
    expect(summary[0].id).toBe('day-1');
    expect(summary[1].id).toBe('day-2');
  });
});
