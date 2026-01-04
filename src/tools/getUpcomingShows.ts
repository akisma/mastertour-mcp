/**
 * Get Upcoming Shows Tool
 *
 * Provides a quick view of upcoming performances across all accessible tours,
 * sorted by date. Useful for TMs managing multiple tours.
 */

import type { MasterTourClient } from '../api/client.js';
import { iterateTourDays, countAccessibleTours } from '../utils/tourIterator.js';
import { formatDate, separator } from '../utils/formatters.js';
import type { ToolResult, UpcomingShowsOutput, UpcomingShowOutput } from '../types/outputs.js';

export interface GetUpcomingShowsParams {
  tourId?: string;
  limit?: number;
  daysAhead?: number;
}

/**
 * Gets upcoming shows across all accessible tours.
 */
export async function getUpcomingShows(
  client: MasterTourClient,
  params: GetUpcomingShowsParams
): Promise<ToolResult<UpcomingShowsOutput>> {
  const { tourId, limit = 10, daysAhead } = params;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const maxDate = daysAhead
    ? new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000)
    : null;

  const upcomingShows: UpcomingShowOutput[] = [];
  const tourCount = await countAccessibleTours(client, tourId);

  // Use iterator with show-day filtering
  for await (const ctx of iterateTourDays(client, { tourId, onlyShowDays: true })) {
    // Parse date
    const dayDateStr = ctx.day.dayDate?.split(' ')[0];
    if (!dayDateStr) continue;

    const dayDate = new Date(dayDateStr);
    dayDate.setHours(0, 0, 0, 0);

    // Must be today or future
    if (dayDate < today) continue;

    // Check days ahead limit
    if (maxDate && dayDate > maxDate) continue;

    upcomingShows.push({
      dayId: ctx.day.id,
      tourLabel: ctx.tourLabel,
      date: dayDateStr,
      dayType: ctx.day.dayType || 'Show',
      venueName: ctx.day.name || 'TBD',
      city: ctx.day.city || '',
      state: ctx.day.state || '',
      country: ctx.day.country || '',
    });
  }

  // Sort by date
  upcomingShows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Limit results
  const results = upcomingShows.slice(0, limit);

  // Build structured data
  const data: UpcomingShowsOutput = {
    shows: results,
    totalFound: upcomingShows.length,
    limit,
    toursSearched: tourCount,
  };

  // Build formatted text
  const text = formatUpcomingShows(data, tourId, daysAhead);

  return { data, text };
}

function formatUpcomingShows(
  data: UpcomingShowsOutput,
  tourId?: string,
  daysAhead?: number
): string {
  const lines: string[] = [
    '🎤 Upcoming Shows',
    separator(),
    '',
  ];

  if (data.shows.length === 0) {
    if (tourId) {
      lines.push('ℹ️ No upcoming shows found for this tour.');
    } else {
      lines.push('ℹ️ No upcoming shows found across your tours.');
    }
    lines.push('');
    lines.push(`📊 Searched ${data.toursSearched} tour(s)`);
  } else {
    const showing =
      data.totalFound > data.limit
        ? `Showing next ${data.limit} of ${data.totalFound} shows`
        : `${data.shows.length} upcoming show(s)`;

    if (daysAhead) {
      lines.push(`${showing} (within ${daysAhead} days):`);
    } else {
      lines.push(`${showing}:`);
    }
    lines.push('');

    for (const show of data.shows) {
      lines.push(`📅 ${formatDate(show.date)}`);
      lines.push(`   🏟️ ${show.venueName}`);
      const location = [show.city, show.state, show.country].filter(Boolean).join(', ');
      lines.push(`   📍 ${location || 'Location TBD'}`);
      if (!tourId) {
        lines.push(`   🎭 ${show.tourLabel}`);
      }
      lines.push(`   🔑 Day ID: ${show.dayId}`);
      lines.push('');
    }

    lines.push(separator());
    lines.push(`📊 Searched ${data.toursSearched} tour(s)`);
    lines.push('');
    lines.push('💡 Use get_today_schedule with a specific date to see full day details.');
  }

  return lines.join('\n');
}
