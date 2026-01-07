/**
 * Validates that a tour ID is present.
 * Throws a descriptive error if missing.
 *
 * @param tourId - The tour ID to validate
 * @returns The validated tour ID
 * @throws Error if tourId is undefined or empty
 */
export function validateTourId(tourId: string | undefined): string {
  if (!tourId) {
    throw new Error(
      'Tour ID is required. Provide tourId parameter or set MASTERTOUR_DEFAULT_TOUR_ID environment variable.'
    );
  }
  return tourId;
}
