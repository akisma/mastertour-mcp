import type { MasterTourClient, DayEvent, TourInfo } from '../api/client.js';

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
 * Normalizes a string for fuzzy matching (lowercase, remove special chars)
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

/**
 * Checks if a query matches a venue (fuzzy matching on name, city, state)
 */
function matchesQuery(venue: { name: string; city: string; state: string; country: string }, query: string): boolean {
  const normalizedQuery = normalize(query);
  const queryTerms = normalizedQuery.split(/\s+/).filter(t => t.length > 0);
  
  const searchFields = [
    normalize(venue.name),
    normalize(venue.city),
    normalize(venue.state),
    normalize(venue.country),
  ].join(' ');
  
  // All query terms must match somewhere
  return queryTerms.every(term => searchFields.includes(term));
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
 * Searches for venues across the user's past tours.
 * 
 * This tool aggregates venue data from all accessible tours and allows
 * fuzzy searching by venue name, city, or state. Since the Master Tour API
 * doesn't provide a global venue search, this searches within the user's
 * historical tour data.
 */
export async function searchPastVenues(
  client: MasterTourClient,
  params: SearchPastVenuesParams
): Promise<string> {
  const { query, tourId, limit = 10 } = params;

  if (!query || query.trim().length < 2) {
    throw new Error('Search query must be at least 2 characters');
  }

  // Get tours to search
  let tours: TourInfo[];
  if (tourId) {
    // Single tour search
    tours = [{ tourId, organizationName: '', artistName: '', legName: '', organizationPermissionLevel: '' }];
  } else {
    // Search all accessible tours
    tours = await client.listTours();
  }

  const venueMap = new Map<string, VenueSearchResult>();

  // Process each tour to find venues
  for (const tour of tours) {
    try {
      const tourData = await client.getTourAll(tour.tourId);
      const tourLabel = `${tourData.tour.artistName} - ${tourData.tour.legName}`.trim() || tour.tourId;
      
      // Get days that have venues (name field populated means it has a venue)
      const daysWithVenues = tourData.tour.days.filter(d => d.name && d.name.trim());
      
      // Fetch events for each day to get venue details
      for (const day of daysWithVenues) {
        try {
          const events = await client.getDayEvents(day.id);
          
          for (const event of events) {
            if (event.venueId && event.venueName) {
              if (!venueMap.has(event.venueId)) {
                venueMap.set(event.venueId, {
                  venueId: event.venueId,
                  name: event.venueName,
                  city: event.venueCity || '',
                  state: event.venueState || '',
                  country: event.venueCountry || '',
                  capacity: event.venueCapacity || '',
                  type: event.venueType || '',
                  lastUsed: day.dayDate?.split(' ')[0] || '',
                  tourCount: 1,
                  tours: [tourLabel],
                });
              } else {
                const existing = venueMap.get(event.venueId)!;
                // Update if this is more recent
                const existingDate = new Date(existing.lastUsed);
                const currentDate = new Date(day.dayDate?.split(' ')[0] || '');
                if (currentDate > existingDate) {
                  existing.lastUsed = day.dayDate?.split(' ')[0] || existing.lastUsed;
                }
                // Track all tours that used this venue
                if (!existing.tours.includes(tourLabel)) {
                  existing.tours.push(tourLabel);
                  existing.tourCount = existing.tours.length;
                }
              }
            }
          }
        } catch {
          // Skip days that fail to fetch events
        }
      }
    } catch {
      // Skip tours that fail to fetch
    }
  }

  // Filter venues by search query
  const allVenues = Array.from(venueMap.values());
  const matchingVenues = allVenues.filter(v => matchesQuery(v, query));

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
    '─'.repeat(50),
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
    lines.push(`📊 Searched ${tours.length} tour(s), found ${allVenues.length} total venues`);
  } else {
    lines.push(`Found ${results.length} venue(s)${matchingVenues.length > limit ? ` (showing top ${limit})` : ''}:`);
    lines.push('');

    for (let i = 0; i < results.length; i++) {
      lines.push(...formatVenueResult(results[i], i));
      lines.push('');
    }

    lines.push('─'.repeat(50));
    lines.push(`📊 Searched ${tours.length} tour(s), found ${allVenues.length} total unique venues`);
    lines.push('');
    lines.push('💡 Use get_venue_details with a venue ID for full production specs, contacts, and facilities.');
  }

  return lines.join('\n');
}
