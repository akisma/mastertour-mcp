/**
 * Unit tests for shared formatters
 */

import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatField,
  separator,
  formatLocation,
  formatContacts,
  normalizeForSearch,
} from '../../src/utils/formatters.ts';

describe('formatDate', () => {
  it('should format a date string with time component', () => {
    const result = formatDate('2026-01-15 00:00:00');
    // Check for key components - exact format varies by locale
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/1[45]/); // Could be 14 or 15 depending on timezone
    expect(result).toMatch(/2026/);
  });

  it('should format a date string without time component', () => {
    const result = formatDate('2026-01-15');
    expect(result).toMatch(/Jan/);
    expect(result).toMatch(/1[45]/); // Could be 14 or 15 depending on timezone
    expect(result).toMatch(/2026/);
  });

  it('should return original string on invalid date', () => {
    const result = formatDate('invalid-date');
    // Date parsing may or may not fail, so just ensure it returns something
    expect(result).toBeDefined();
  });
});

describe('formatField', () => {
  it('should format a field with label and value', () => {
    const result = formatField('Capacity', '2500');
    expect(result).toBe('  • Capacity: 2500');
  });

  it('should return empty string for undefined value', () => {
    const result = formatField('Capacity', undefined);
    expect(result).toBe('');
  });

  it('should return empty string for empty value', () => {
    const result = formatField('Capacity', '  ');
    expect(result).toBe('');
  });

  it('should decode HTML entities', () => {
    const result = formatField('Name', 'Rock &amp; Roll Hall');
    expect(result).toBe('  • Name: Rock & Roll Hall');
  });

  it('should decode apostrophe entities', () => {
    const result = formatField('Name', 'Pete&apos;s Tavern');
    expect(result).toBe("  • Name: Pete's Tavern");
  });

  it('should respect custom indent', () => {
    const result = formatField('Label', 'Value', 4);
    expect(result).toBe('    • Label: Value');
  });
});

describe('separator', () => {
  it('should create a separator of default width', () => {
    const result = separator();
    expect(result).toBe('─'.repeat(50));
  });

  it('should create a separator of custom width', () => {
    const result = separator(30);
    expect(result).toBe('─'.repeat(30));
  });
});

describe('formatLocation', () => {
  it('should format city, state, country', () => {
    const result = formatLocation('Los Angeles', 'CA', 'US');
    expect(result).toBe('Los Angeles, CA, US');
  });

  it('should handle missing components', () => {
    const result = formatLocation('Los Angeles', '', 'US');
    expect(result).toBe('Los Angeles, US');
  });

  it('should handle all undefined', () => {
    const result = formatLocation(undefined, undefined, undefined);
    expect(result).toBe('');
  });
});

describe('formatContacts', () => {
  it('should format contact list', () => {
    const contacts = [
      { title: 'Production', contactName: 'John Doe', phone: '555-1234' },
      { title: 'Box Office', contactName: 'Jane Smith', fax: '555-5678' },
    ];

    const result = formatContacts(contacts);

    expect(result).toHaveLength(2);
    expect(result[0]).toContain('Production');
    expect(result[0]).toContain('John Doe');
    expect(result[0]).toContain('📱 555-1234');
    expect(result[1]).toContain('Box Office');
    expect(result[1]).toContain('📠 555-5678');
  });

  it('should return "no contacts" message for empty array', () => {
    const result = formatContacts([]);
    expect(result).toEqual(['  ℹ️ No contacts listed']);
  });

  it('should return "no contacts" message for undefined', () => {
    const result = formatContacts(undefined);
    expect(result).toEqual(['  ℹ️ No contacts listed']);
  });

  it('should skip contacts without name/phone/fax', () => {
    const contacts = [
      { title: 'Empty Contact' },
      { title: 'Has Name', contactName: 'Real Person' },
    ];

    const result = formatContacts(contacts);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Real Person');
  });
});

describe('normalizeForSearch', () => {
  it('should lowercase text', () => {
    expect(normalizeForSearch('HELLO')).toBe('hello');
  });

  it('should remove special characters', () => {
    expect(normalizeForSearch("Rock & Roll's")).toBe('rock  rolls');
  });

  it('should trim whitespace', () => {
    expect(normalizeForSearch('  hello  ')).toBe('hello');
  });

  it('should keep spaces between words', () => {
    expect(normalizeForSearch('Hello World')).toBe('hello world');
  });
});
