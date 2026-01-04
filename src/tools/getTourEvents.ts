import type { MasterTourClient, TourEventsResponse, EventDayInfo } from '../api/client.js';
import { format, parseISO } from 'date-fns';
import type { ToolResult, TourEventsOutput, TourEventOutput } from '../types/outputs.js';

export interface GetTourEventsParams {
  tourId?: string;
  showsOnly?: boolean;
}

/**
 * Formats a date string for display
 */
function formatDateStr(dateStr: string): string {
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
  const dateStr = formatDateStr(day.dayDate);
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
 * Gets tour events/dates.
 * Caller should resolve tourId from config if not provided.
 */
export async function getTourEvents(
  client: MasterTourClient,
  params: GetTourEventsParams
): Promise<ToolResult<TourEventsOutput>> {
  const { tourId } = params;

  if (!tourId) {
    throw new Error(
      'Tour ID is required. Provide tourId parameter or set MASTERTOUR_DEFAULT_TOUR_ID environment variable.'
    );
  }

  const response = await client.getTourEvents(tourId);
  const { tour, days } = response;

  // Filter to shows only if requested
  let filteredDays = days;
  if (params.showsOnly) {
    filteredDays = days.filter(d => 
      d.dayType?.toLowerCase().includes('show')
    );
  }

  // Count day types
  const showDays = days.filter(d => d.dayType?.toLowerCase().includes('show')).length;
  const travelDays = days.filter(d => d.dayType?.toLowerCase().includes('travel')).length;
  const offDays = days.filter(d => d.dayType?.toLowerCase().includes('off')).length;

  // Build structured data
  const events: TourEventOutput[] = filteredDays.map((day) => ({
    dayId: day.id,
    date: day.dayDate.split(' ')[0],
    venueName: day.name || '',
    city: day.city || '',
    state: day.state || '',
    dayType: day.dayType || 'Show Day',
    promoter: undefined, // Not available in this response
    ticketCount: undefined,
    capacity: undefined,
  }));

  const data: TourEventsOutput = {
    tourId,
    events,
    totalCount: filteredDays.length,
    showDays,
    travelDays,
    offDays,
  };

  // Build formatted text
  const text = formatEventsText(tour, filteredDays, days, params.showsOnly);

  return { data, text };
}

function formatEventsText(
  tour: TourEventsResponse['tour'],
  filteredDays: EventDayInfo[],
  allDays: EventDayInfo[],
  showsOnly?: boolean
): string {
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
  
  if (!showsOnly && filteredDays.length !== allDays.length) {
    const showCount = allDays.filter(d => d.dayType?.toLowerCase().includes('show')).length;
    lines.push(`Shows: ${showCount}`);
  }

  return lines.join('\n');
}
