import { describe, it, expect } from 'vitest';
import { validateTourId } from '../../src/utils/validation.js';

describe('validateTourId', () => {
  it('returns the tourId when provided a valid string', () => {
    const result = validateTourId('tour-123');
    expect(result).toBe('tour-123');
  });

  it('throws an error when tourId is undefined', () => {
    expect(() => validateTourId(undefined)).toThrow(
      'Tour ID is required. Provide tourId parameter or set MASTERTOUR_DEFAULT_TOUR_ID environment variable.'
    );
  });

  it('throws an error when tourId is an empty string', () => {
    expect(() => validateTourId('')).toThrow(
      'Tour ID is required. Provide tourId parameter or set MASTERTOUR_DEFAULT_TOUR_ID environment variable.'
    );
  });

  it('accepts numeric string tour IDs', () => {
    const result = validateTourId('12345');
    expect(result).toBe('12345');
  });
});
