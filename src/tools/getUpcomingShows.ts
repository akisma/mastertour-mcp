import type { MasterTourClient, TourInfo } from '../api/client.js';

export interface GetUpcomingShowsParams {
  tourId?: string;
  limit?: number;
  daysAhead?: number;
}

interface UpcomingShow {
  dayId: string;
  tourLabel: string;
  artistName: string;
  legName: string;
  date: string;
  dayType: string;
  venueName: string;
  city: string;
  state: string;
  country: string;
}

/**
 * Formats a date for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr.split(' ')[0]);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Gets upcoming shows across all accessible tours.
 * 
 * This tool provides a quick view of upcoming performances,
 * sorted by date. Useful for TMs managing multiple tours.
 */
export async function getUpcomingShows(
  client: MasterTourClient,
  params: GetUpcomingShowsParams
): Promise<string> {
  const { tourId, limit = 10, daysAhead } = params;

  // Get tours to search
  let tours: TourInfo[];
  if (tourId) {
    tours = [{ tourId, organizationName: '', artistName: '', legName: '', organizationPermissionLevel: '' }];
  } else {
    tours = await client.listTours();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const maxDate = daysAhead ? new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000) : null;

  const upcomingShows: UpcomingShow[] = [];

  // Process each tour
  for (const tour of tours) {
    try {
      const tourData = await client.getTourAll(tour.tourId);
      const tourLabel = `${tourData.tour.artistName} - ${tourData.tour.legName}`.trim() || 'Unknown Tour';
      
      // Filter to show days only, in the future
      for (const day of tourData.tour.days) {
        // Check if it's a show day
        const dayType = (day.dayType || '').toLowerCase();
        if (!dayType.includes('show')) continue;
        
        // Parse date
        const dayDateStr = day.dayDate?.split(' ')[0];
        if (!dayDateStr) continue;
        
        const dayDate = new Date(dayDateStr);
        dayDate.setHours(0, 0, 0, 0);
        
        // Must be today or future
        if (dayDate < today) continue;
        
        // Check days ahead limit
        if (maxDate && dayDate > maxDate) continue;
        
        upcomingShows.push({
          dayId: day.id,
          tourLabel,
          artistName: tourData.tour.artistName || '',
          legName: tourData.tour.legName || '',
          date: dayDateStr,
          dayType: day.dayType || 'Show',
          venueName: day.name || 'TBD',
          city: day.city || '',
          state: day.state || '',
          country: day.country || '',
        });
      }
    } catch {
      // Skip tours that fail
    }
  }

  // Sort by date
  upcomingShows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Limit results
  const results = upcomingShows.slice(0, limit);

  // Build output
  const lines: string[] = [
    `🎤 Upcoming Shows`,
    '─'.repeat(50),
    '',
  ];

  if (results.length === 0) {
    if (tourId) {
      lines.push('ℹ️ No upcoming shows found for this tour.');
    } else {
      lines.push('ℹ️ No upcoming shows found across your tours.');
    }
    lines.push('');
    lines.push(`📊 Searched ${tours.length} tour(s)`);
  } else {
    const showing = upcomingShows.length > limit 
      ? `Showing next ${limit} of ${upcomingShows.length} shows` 
      : `${results.length} upcoming show(s)`;
    
    if (daysAhead) {
      lines.push(`${showing} (within ${daysAhead} days):`);
    } else {
      lines.push(`${showing}:`);
    }
    lines.push('');

    for (const show of results) {
      lines.push(`📅 ${formatDate(show.date)}`);
      lines.push(`   🏟️ ${show.venueName}`);
      lines.push(`   📍 ${show.city}${show.state ? `, ${show.state}` : ''}${show.country ? ` ${show.country}` : ''}`);
      if (!tourId) {
        lines.push(`   🎭 ${show.tourLabel}`);
      }
      lines.push(`   🔑 Day ID: ${show.dayId}`);
      lines.push('');
    }

    lines.push('─'.repeat(50));
    lines.push(`📊 Searched ${tours.length} tour(s)`);
    lines.push('');
    lines.push('💡 Use get_today_schedule with a specific date to see full day details.');
  }

  return lines.join('\n');
}
