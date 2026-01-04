/**
 * Search Past Venues Tool
 *
 * Searches for venues across the user's past tours. Since the Master Tour API
 * doesn't provide a global venue search, this aggregates venue data from the
 * user's historical tour data and allows fuzzy searching.
 */

import type { MasterTourClient, DayEvent } from '../api/client.js';
import { iterateTourDays, getDayEventsSafe, countAccessibleTours } from '../utils/tourIterator.js';
import { normalizeForSearch, separator } from '../utils/formatters.js';

export interface SearchPastVenuesParams {
  query: string;
  tourId?: string;
  limit?: number;
}

export interface VenueSearchResult {
  venueId: string;
  name: string;
  city: string;
  state: string;
  country: string;
  capacity: string;
  type: string;
  lastUsed: string;
  tourCount: number;
  tours: string[];
}

/**
 * Checks if a query matches a venue (fuzzy matching on name, city, state)
 */
function matchesQuery(
  venue: { name: string; city: string; state: string; country: string },
  query: string
): boolean {
  const normalizedQuery = normalizeForSearch(query);
  const queryTerms = normalizedQuery.split(/\s+/).filter((t) => t.length > 0);

  const searchFields = [
    normalizeForSearch(venue.name),
    normalizeForSearch(venue.city),
    normalizeForSearch(venue.state),
    normalizeForSearch(venue.country),
  ].join(' ');

  // All query terms must match somewhere
  return queryTerms.every((term) => searchFields.includes(term));
}

/**
 * Formats a venue result for display
 */
function formatVenueResult(venue: VenueSearchResult, index: number): string[] {
  const lines: string[] = [];

  lines.push(`${index + 1}. 🏟️ ${venue.name}`);
  lines.push(`   📍 ${venue.city}, ${venue.state} ${venue.country}`);

  if (venue.capacity && venue.capacity !== '0') {
    lines.push(`   👥 Capacity: ${venue.capacity} | Type: ${venue.type || 'N/A'}`);
  } else {
    lines.push(`   🏷️ Type: ${venue.type || 'N/A'}`);
  }

  lines.push(`   🎫 Used on: ${venue.tours.join(', ')}`);
  lines.push(`   📅 Last used: ${venue.lastUsed}`);
  lines.push(`   🔑 ID: ${venue.venueId}`);

  return lines;
}

/**
 * Adds or updates a venue in the map
 */
function upsertVenue(
  venueMap: Map<string, VenueSearchResult>,
  event: DayEvent,
  tourLabel: string,
  dayDate: string
): void {
  const venueId = event.venueId;
  if (!venueId || !event.venueName) return;

  const existing = venueMap.get(venueId);
  if (!existing) {
    venueMap.set(venueId, {
      venueId,
      name: event.venueName,
      city: event.venueCity || '',
      state: event.venueState || '',
      country: event.venueCountry || '',
      capacity: event.venueCapacity || '',
      type: event.venueType || '',
      lastUsed: dayDate,
      tourCount: 1,
      tours: [tourLabel],
    });
  } else {
    // Update if this is more recent
    const existingDate = new Date(existing.lastUsed);
    const currentDate = new Date(dayDate);
    if (currentDate > existingDate) {
      existing.lastUsed = dayDate;
    }
    // Track all tours that used this venue
    if (!existing.tours.includes(tourLabel)) {
      existing.tours.push(tourLabel);
      existing.tourCount = existing.tours.length;
    }
  }
}

/**
 * Searches for venues across the user's past tours.
 */
export async function searchPastVenues(
  client: MasterTourClient,
  params: SearchPastVenuesParams
): Promise<string> {
  const { query, tourId, limit = 10 } = params;

  if (!query || query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters');
  }

  const tourCount = await countAccessibleTours(client, tourId);
  const venueMap = new Map<string, VenueSearchResult>();

  // Process days with venues using iterator
  for await (const ctx of iterateTourDays(client, { tourId, onlyDaysWithVenues: true })) {
    const events = await getDayEventsSafe(client, ctx.day.id);
    const dayDate = ctx.day.dayDate?.split(' ')[0] || '';

    for (const event of events) {
      upsertVenue(venueMap, event, ctx.tourLabel, dayDate);
    }
  }

  // Filter venues by search query
  const allVenues = Array.from(venueMap.values());
  const matchingVenues = allVenues.filter((v) => matchesQuery(v, query));

  // Sort by tour count (most used first), then by last used date
  matchingVenues.sort((a, b) => {
    if (b.tourCount !== a.tourCount) {
      return b.tourCount - a.tourCount;
    }
    return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
  });

  // Limit results
  const results = matchingVenues.slice(0, limit);

  // Build output
  const lines: string[] = [
    `🔍 Venue Search: "${query}"`,
    separator(),
    '',
  ];

  if (results.length === 0) {
    lines.push(`ℹ️ No venues found matching "${query}"`);
    lines.push('');
    lines.push('Tips:');
    lines.push('• Try searching by venue name (e.g., "palladium")');
    lines.push('• Try searching by city (e.g., "los angeles")');
    lines.push('• Try searching by state (e.g., "california" or "CA")');
    lines.push('');
    lines.push(`📊 Searched ${tourCount} tour(s), found ${allVenues.length} total venues`);
  } else {
    lines.push(
      `Found ${results.length} venue(s)${matchingVenues.length > limit ? ` (showing top ${limit})` : ''}:`
    );
    lines.push('');

    for (let i = 0; i < results.length; i++) {
      lines.push(...formatVenueResult(results[i], i));
      lines.push('');
    }

    lines.push(separator());
    lines.push(`📊 Searched ${tourCount} tour(s), found ${allVenues.length} total unique venues`);
    lines.push('');
    lines.push('💡 Use get_venue_details with a venue ID for full production specs, contacts, and facilities.');
  }

  return lines.join('\n');
}
