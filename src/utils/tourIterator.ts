/**
 * Tour iteration utilities for Mastertour MCP tools
 *
 * Provides shared logic for iterating over tours and days,
 * reducing code duplication in venue research tools.
 */

import type { MasterTourClient, TourInfo, EventDayInfo, DayEvent, TourAllResponse } from '../api/client.js';

export interface TourDayContext {
  tour: TourInfo;
  tourData: TourAllResponse;
  tourLabel: string;
  day: EventDayInfo;
}

export interface TourIteratorOptions {
  /** If provided, only iterate this tour */
  tourId?: string;
  /** If true, only yield days with venues (name field populated) */
  onlyDaysWithVenues?: boolean;
  /** If true, only yield show days */
  onlyShowDays?: boolean;
}

/**
 * Creates a mock TourInfo for a single tour ID
 */
function createTourInfoStub(tourId: string): TourInfo {
  return {
    tourId,
    organizationName: '',
    artistName: '',
    legName: '',
    organizationPermissionLevel: '',
  };
}

/**
 * Builds a human-readable label for a tour
 */
export function buildTourLabel(tourData: TourAllResponse): string {
  const parts = [tourData.tour.artistName, tourData.tour.legName].filter(Boolean);
  return parts.join(' - ') || 'Unknown Tour';
}

/**
 * Async generator that yields tour/day contexts for processing.
 *
 * This centralizes the common pattern of:
 * 1. Get list of tours (or use a single tour)
 * 2. Fetch tour data for each
 * 3. Iterate days with optional filtering
 *
 * @param client The Master Tour client
 * @param options Iterator options
 * @yields TourDayContext for each matching day
 */
export async function* iterateTourDays(
  client: MasterTourClient,
  options: TourIteratorOptions = {}
): AsyncGenerator<TourDayContext> {
  const { tourId, onlyDaysWithVenues, onlyShowDays } = options;

  // Get tours to process
  let tours: TourInfo[];
  if (tourId) {
    tours = [createTourInfoStub(tourId)];
  } else {
    tours = await client.listTours();
  }

  // Process each tour
  for (const tour of tours) {
    let tourData: TourAllResponse;
    try {
      tourData = await client.getTourAll(tour.tourId);
    } catch {
      // Skip tours that fail to fetch
      continue;
    }

    const tourLabel = buildTourLabel(tourData);

    // Iterate days with filtering
    for (const day of tourData.tour.days) {
      // Filter: only days with venues
      if (onlyDaysWithVenues && (!day.name || !day.name.trim())) {
        continue;
      }

      // Filter: only show days
      if (onlyShowDays) {
        const dayType = (day.dayType || '').toLowerCase();
        if (!dayType.includes('show')) {
          continue;
        }
      }

      yield { tour, tourData, tourLabel, day };
    }
  }
}

/**
 * Fetches day events with error handling.
 * Returns empty array on failure instead of throwing.
 */
export async function getDayEventsSafe(
  client: MasterTourClient,
  dayId: string
): Promise<DayEvent[]> {
  try {
    return await client.getDayEvents(dayId);
  } catch {
    return [];
  }
}

/**
 * Collects all tours and counts them (useful for result summaries)
 */
export async function countAccessibleTours(
  client: MasterTourClient,
  tourId?: string
): Promise<number> {
  if (tourId) return 1;
  const tours = await client.listTours();
  return tours.length;
}
