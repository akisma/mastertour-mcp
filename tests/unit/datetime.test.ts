import { describe, it, expect } from 'vitest';
import { localTimeToUtc } from '../../src/utils/datetime.js';

describe('localTimeToUtc', () => {
  it('converts local time to UTC for America/New_York timezone', () => {
    // 10:00 AM in New York on July 15 (EDT, -4 hours) should be 14:00 UTC
    const result = localTimeToUtc('2024-07-15', '10:00', 'America/New_York');
    expect(result).toBe('2024-07-15 14:00:00');
  });

  it('converts local time to UTC for America/Los_Angeles timezone', () => {
    // 10:00 AM in Los Angeles on July 15 (PDT, -7 hours) should be 17:00 UTC
    const result = localTimeToUtc('2024-07-15', '10:00', 'America/Los_Angeles');
    expect(result).toBe('2024-07-15 17:00:00');
  });

  it('converts local time to UTC for Europe/London timezone during DST', () => {
    // 10:00 AM in London on July 15 (BST, +1 hour) should be 09:00 UTC
    const result = localTimeToUtc('2024-07-15', '10:00', 'Europe/London');
    expect(result).toBe('2024-07-15 09:00:00');
  });

  it('converts local time to UTC for Europe/London timezone outside DST', () => {
    // 10:00 AM in London on January 15 (GMT, +0 hours) should be 10:00 UTC
    const result = localTimeToUtc('2024-01-15', '10:00', 'Europe/London');
    expect(result).toBe('2024-01-15 10:00:00');
  });

  it('handles midnight correctly', () => {
    const result = localTimeToUtc('2024-07-15', '00:00', 'America/New_York');
    expect(result).toBe('2024-07-15 04:00:00');
  });

  it('handles late night that crosses into next day UTC', () => {
    // 10:00 PM in New York (EDT, -4 hours) should be 02:00 UTC next day
    const result = localTimeToUtc('2024-07-15', '22:00', 'America/New_York');
    expect(result).toBe('2024-07-16 02:00:00');
  });

  it('handles UTC timezone directly', () => {
    const result = localTimeToUtc('2024-07-15', '10:00', 'UTC');
    expect(result).toBe('2024-07-15 10:00:00');
  });
});
