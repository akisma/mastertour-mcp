import type { MasterTourClient, TourEventsResponse, EventDayInfo } from '../api/client.js';
import { format, parseISO } from 'date-fns';

export interface GetTourEventsParams {
  tourId?: string;
  showsOnly?: boolean;
}

/**
 * Formats a date string for display
 */
function formatDate(dateStr: string): string {
  try {
    const date = parseISO(dateStr.split(' ')[0]);
    return format(date, 'EEE, MMM d, yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Gets emoji for day type
 */
function getDayTypeEmoji(dayType: string): string {
  const type = dayType.toLowerCase();
  if (type.includes('show')) return '🎸';
  if (type.includes('off')) return '😴';
  if (type.includes('travel')) return '✈️';
  if (type.includes('rehearsal')) return '🎵';
  if (type.includes('press') || type.includes('promo')) return '📺';
  return '📅';
}

/**
 * Formats a single event day
 */
function formatEventDay(day: EventDayInfo): string[] {
  const lines: string[] = [];
  const dateStr = formatDate(day.dayDate);
  const emoji = getDayTypeEmoji(day.dayType || 'Show Day');
  const location = [day.city, day.state, day.country].filter(Boolean).join(', ');

  lines.push(`${emoji} ${dateStr}`);
  lines.push(`   ${day.dayType || 'Show Day'}`);
  
  if (day.name) {
    lines.push(`   🏟️ ${day.name}`);
  }
  
  if (location) {
    lines.push(`   📍 ${location}`);
  }
  
  lines.push(`   🆔 Day ID: ${day.id}`);

  return lines;
}

/**
 * Gets tour events/dates
 */
export async function getTourEvents(
  client: MasterTourClient,
  params: GetTourEventsParams
): Promise<string> {
  const tourId = params.tourId || process.env.MASTERTOUR_DEFAULT_TOUR_ID;

  if (!tourId) {
    throw new Error(
      'Tour ID is required. Provide tourId parameter or set MASTERTOUR_DEFAULT_TOUR_ID environment variable.'
    );
  }

  const data = await client.getTourEvents(tourId);
  const { tour, days } = data;

  // Filter to shows only if requested
  let filteredDays = days;
  if (params.showsOnly) {
    filteredDays = days.filter(d => 
      d.dayType?.toLowerCase().includes('show')
    );
  }

  const lines: string[] = [
    `📅 Tour Dates`,
    `🎸 ${tour.artistName} - ${tour.legName}`,
    '─'.repeat(50),
    '',
  ];

  if (filteredDays.length === 0) {
    lines.push('ℹ️ No events found for this tour.');
    return lines.join('\n');
  }

  for (const day of filteredDays) {
    lines.push(...formatEventDay(day));
    lines.push('');
  }

  lines.push('─'.repeat(50));
  lines.push(`Total: ${filteredDays.length} date(s)`);
  
  if (!params.showsOnly && filteredDays.length !== days.length) {
    const showCount = days.filter(d => d.dayType?.toLowerCase().includes('show')).length;
    lines.push(`Shows: ${showCount}`);
  }

  return lines.join('\n');
}
